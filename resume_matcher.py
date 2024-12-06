import PyPDF2
import docx
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Set, Dict
import re
import json
from pathlib import Path
import spacy
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

class ResumeJobMatcher:
    def __init__(self):
        self.model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
        try:
            self.nlp = spacy.load('en_core_web_sm')
        except:
            import subprocess
            subprocess.run(['python', '-m', 'spacy', 'download', 'en_core_web_sm'])
            self.nlp = spacy.load('en_core_web_sm')
        
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.job_roles = self._load_job_roles()

    def _load_job_roles(self) -> Dict:
        try:
            json_path = Path(__file__).parent / 'job_roles.json'
            with open(json_path, 'r') as f:
                roles = json.load(f)
                return {k: v['description'] for k, v in roles.items()}
        except Exception as e:
            print(f"Warning: Could not load job_roles.json: {e}")
            return {
                'data_scientist': "Data analysis, machine learning, Python",
                'software_engineer': "Software development, Python, Java"
            }

    def calculate_match(self, resume_path: str, jd_path: str, must_have_keywords: List[str] = None, 
                       custom_phrases: List[str] = None, experience_level: str = None) -> Dict:
        resume_text = self._parse_document(resume_path)
        jd_text = self._parse_document(jd_path)

        if not resume_text or not jd_text:
            return {"error": "Could not parse documents"}

        processed_resume = self._preprocess_text(resume_text)
        processed_jd = self._preprocess_text(jd_text)

        if must_have_keywords:
            keyword_match_score = self._check_must_have_keywords(processed_resume, must_have_keywords)
            if keyword_match_score < 0.5:
                return {
                    "overall_match": 0,
                    "similarity_score": 0,
                    "skill_match": 0,
                    "matching_points": [],
                    "missing_points": [f"Missing required keyword: {kw}" for kw in must_have_keywords],
                    "similar_roles": [],
                    "skills_found": []
                }

        resume_embedding = self.model.encode([processed_resume])[0]
        jd_embedding = self.model.encode([processed_jd])[0]

        similarity_score = self._calculate_similarity(resume_embedding, jd_embedding)
        skill_match_score = self._calculate_skill_match(processed_resume, processed_jd)
        requirements_analysis = self._analyze_requirements(processed_resume, processed_jd)
        similar_roles = self._find_similar_roles(processed_resume)

        if experience_level:
            exp_match = self._check_experience_level(processed_resume, experience_level)
            if not exp_match:
                requirements_analysis["missing_points"].insert(0, f"Required experience level: {experience_level}")

        final_score = 0.7 * similarity_score + 0.3 * skill_match_score

        return {
            "overall_match": round(final_score * 100, 2),
            "similarity_score": round(similarity_score * 100, 2),
            "skill_match": round(skill_match_score * 100, 2),
            "matching_points": requirements_analysis["matching_points"][:5],  # Top 5 points
            "missing_points": requirements_analysis["missing_points"][:5],    # Top 5 points
            "similar_roles": similar_roles[:3],
            "skills_found": list(self._extract_skills(processed_resume))
        }

    def _parse_document(self, file_path: str) -> str:
        if file_path.endswith('.pdf'):
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                return ' '.join([page.extract_text() for page in reader.pages])
        elif file_path.endswith('.docx'):
            doc = docx.Document(file_path)
            return ' '.join([paragraph.text for paragraph in doc.paragraphs])
        elif file_path.endswith('.txt'):
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    return file.read()
            except UnicodeDecodeError:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read()
        return ""

    def _preprocess_text(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        doc = self.nlp(text)
        processed_text = ' '.join([token.lemma_ for token in doc 
                                 if not token.is_stop and not token.is_punct])
        return ' '.join(processed_text.split())

    def _extract_skills(self, text: str) -> Set[str]:
        common_skills = {
            'python', 'java', 'javascript', 'c++', 'r', 'sql', 'typescript',
            'html', 'css', 'react', 'angular', 'vue.js', 'node.js',
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn',
            'pandas', 'numpy', 'data analysis', 'statistics', 'nlp', 'computer vision',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd',
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
            'git', 'agile', 'jira', 'tableau', 'power bi'
        }
        
        found_skills = set()
        text_lower = text.lower()
        for skill in common_skills:
            if skill in text_lower:
                found_skills.add(skill)
        return found_skills

    def _analyze_requirements(self, resume_text: str, jd_text: str) -> Dict:
        jd_requirements = self._extract_requirements(jd_text)
        matching_points = []
        missing_points = []
        
        for req in jd_requirements:
            req_embedding = self.model.encode([req])[0]
            resume_embedding = self.model.encode([resume_text])[0]
            similarity = float(np.dot(req_embedding, resume_embedding) / 
                            (np.linalg.norm(req_embedding) * np.linalg.norm(resume_embedding)))
            
            if similarity > 0.6:
                matching_points.append(req)
            else:
                missing_points.append(req)
        
        return {
            "matching_points": matching_points,
            "missing_points": missing_points
        }

    def _extract_requirements(self, text: str) -> List[str]:
        points = text.split('\n')
        requirements = []
        
        for point in points:
            point = point.strip()
            if point and len(point) > 10:
                point = re.sub(r'^[•\*\-\d\.►✓\s]+', '', point)
                point = point.strip()
                if point:
                    requirements.append(point)
        
        return requirements

    def _calculate_similarity(self, resume_embedding: np.ndarray, jd_embedding: np.ndarray) -> float:
        return float(cosine_similarity(resume_embedding.reshape(1, -1), 
                                    jd_embedding.reshape(1, -1))[0][0])

    def _calculate_skill_match(self, resume_text: str, jd_text: str) -> float:
        resume_skills = self._extract_skills(resume_text)
        jd_skills = self._extract_skills(jd_text)
        
        if not jd_skills:
            return 0.0
            
        matched_skills = resume_skills.intersection(jd_skills)
        return len(matched_skills) / len(jd_skills)

    def _check_must_have_keywords(self, text: str, keywords: List[str]) -> float:
        text = text.lower()
        found = sum(1 for kw in keywords if kw.lower() in text)
        return found / len(keywords)

    def _check_experience_level(self, text: str, level: str) -> bool:
        text = text.lower()
        experience_patterns = {
            'entry': r'\b([0-2]|one|two)\s+years?\b',
            'mid': r'\b([3-5]|three|four|five)\s+years?\b',
            'senior': r'\b([5-7]|five|six|seven)\s+years?\b',
            'lead': r'\b([8-9]|eight|nine|ten|\d{2,})\s+years?\b'
        }
        return bool(re.search(experience_patterns[level], text))

    def _find_similar_roles(self, text: str) -> List[Dict]:
        text_embedding = self.model.encode([text])[0]
        role_similarities = []
        
        for role, description in self.job_roles.items():
            role_embedding = self.model.encode([description])[0]
            similarity = float(np.dot(text_embedding, role_embedding) / 
                            (np.linalg.norm(text_embedding) * np.linalg.norm(role_embedding)))
            
            try:
                with open(Path(__file__).parent / 'job_roles.json', 'r') as f:
                    roles_data = json.load(f)
                    title = roles_data[role]['title']
            except:
                title = role.replace('_', ' ').title()
            
            role_similarities.append({
                "role": title,
                "similarity": round(similarity * 100, 2)
            })
        
        return sorted(role_similarities, key=lambda x: x['similarity'], reverse=True) 