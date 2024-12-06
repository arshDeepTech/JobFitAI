from flask import Flask, render_template, request, jsonify, url_for
from resume_matcher import ResumeJobMatcher
import os
import json

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

matcher = ResumeJobMatcher()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files or 'jd' not in request.files:
        return jsonify({'error': 'Both resume and JD files are required'}), 400

    resume_file = request.files['resume']
    jd_file = request.files['jd']

    if not resume_file.filename or not jd_file.filename:
        return jsonify({'error': 'No files selected'}), 400

    resume_path = os.path.join(app.config['UPLOAD_FOLDER'], resume_file.filename)
    jd_path = os.path.join(app.config['UPLOAD_FOLDER'], jd_file.filename)
    
    resume_file.save(resume_path)
    jd_file.save(jd_path)

    try:
        must_have_keywords = request.form.get('must_have_keywords', '[]')
        experience_level = request.form.get('experience_level')
        
        results = matcher.calculate_match(
            resume_path, 
            jd_path,
            must_have_keywords=json.loads(must_have_keywords),
            experience_level=experience_level
        )
        
        os.remove(resume_path)
        os.remove(jd_path)
        
        return jsonify(results)
    
    except Exception as e:
        if os.path.exists(resume_path):
            os.remove(resume_path)
        if os.path.exists(jd_path):
            os.remove(jd_path)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)