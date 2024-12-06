from typing import Dict, List
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from utils import Utils
import re

class ResumeJobMatcher:
    def __init__(self):
        self.utils = Utils()

    def calculate_match(self, resume_path: str, jd_path: str, must_have_keywords: List[str] = None, 
                       custom_phrases: List[str] = None, experience_level: str = None) -> Dict:
        resume_text = self.utils.parse_document(resume_path)
        jd_text = self.utils.parse_document(jd_path)

        if not resume_text or not jd_text:
            return {"error": "Could not parse documents"}

        processed_resume = self.utils.preprocess_text(resume_text)
        processed_jd = self.utils.preprocess_text(jd_text)

        # Apply filters
        if must_have_keywords:
            keyword_match_score = self._check_must_have_keywords(processed_resume, must_have_keywords)
            if keyword_match_score < 0.5:  # Less than 50% of required keywords found
                return {
                    "overall_match": 0,
                    "similarity_score": 0,
                    "skill_match": 0,
                    "matching_points": [],
                    "missing_points": [f"Missing required keyword: {kw}" for kw in must_have_keywords],
                    "similar_roles": [],
                    "skills_found": []
                }

        if custom_phrases:
            phrase_match_score = self._check_custom_phrases(processed_resume, custom_phrases)
            if phrase_match_score < 0.3:  # Less than 30% of custom phrases found
                return {
                    "overall_match": 0,
                    "similarity_score": 0,
                    "skill_match": 0,
                    "matching_points": [],
                    "missing_points": [f"Missing required phrase: {phrase}" for phrase in custom_phrases],
                    "similar_roles": [],
                    "skills_found": []
                }

        # Continue with regular matching
        resume_embedding = self.utils.get_embeddings(processed_resume)
        jd_embedding = self.utils.get_embeddings(processed_jd)

        similarity_score = self._calculate_similarity(resume_embedding, jd_embedding)
        skill_match_score = self._calculate_skill_match(processed_resume, processed_jd)
        requirements_analysis = self.utils.analyze_requirements(processed_resume, processed_jd)
        similar_roles = self.utils.find_similar_roles(processed_resume)

        # Apply experience level filter if specified
        if experience_level:
            exp_match = self._check_experience_level(processed_resume, experience_level)
            if not exp_match:
                requirements_analysis["missing_points"].insert(0, f"Required experience level: {experience_level}")

        final_score = 0.7 * similarity_score + 0.3 * skill_match_score

        return {
            "overall_match": round(final_score * 100, 2),
            "similarity_score": round(similarity_score * 100, 2),
            "skill_match": round(skill_match_score * 100, 2),
            "matching_points": requirements_analysis["matching_points"],
            "missing_points": requirements_analysis["missing_points"],
            "similar_roles": similar_roles[:3],
            "skills_found": list(self.utils.extract_skills(processed_resume))
        }

    def _calculate_similarity(self, resume_embedding: np.ndarray, jd_embedding: np.ndarray) -> float:
        return float(cosine_similarity(resume_embedding.reshape(1, -1), 
                                    jd_embedding.reshape(1, -1))[0][0])

    def _calculate_skill_match(self, resume_text: str, jd_text: str) -> float:
        resume_skills = self.utils.extract_skills(resume_text)
        jd_skills = self.utils.extract_skills(jd_text)
        
        if not jd_skills:
            return 0.0
            
        matched_skills = resume_skills.intersection(jd_skills)
        return len(matched_skills) / len(jd_skills) 

    def _check_must_have_keywords(self, text: str, keywords: List[str]) -> float:
        text = text.lower()
        found = sum(1 for kw in keywords if kw.lower() in text)
        return found / len(keywords)

    def _check_custom_phrases(self, text: str, phrases: List[str]) -> float:
        text = text.lower()
        found = sum(1 for phrase in phrases if phrase.lower() in text)
        return found / len(phrases)

    def _check_experience_level(self, text: str, level: str) -> bool:
        text = text.lower()
        experience_patterns = {
            'entry': r'\b([0-2]|one|two)\s+years?\b',
            'mid': r'\b([3-5]|three|four|five)\s+years?\b',
            'senior': r'\b([5-7]|five|six|seven)\s+years?\b',
            'lead': r'\b([8-9]|eight|nine|ten|\d{2,})\s+years?\b'
        }
        return bool(re.search(experience_patterns[level], text))