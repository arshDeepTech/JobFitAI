let currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-bs-theme', currentTheme);

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-switch i');
    icon.className = currentTheme === 'light' ? 'bi bi-moon-stars' : 'bi bi-sun';
}

$(document).ready(function() {
    const keywordOptions = [
        { id: 'python', text: 'Python' },
        { id: 'java', text: 'Java' },
        { id: 'javascript', text: 'JavaScript' },
        { id: 'react', text: 'React' },
        { id: 'node.js', text: 'Node.js' },
        { id: 'sql', text: 'SQL' },
        { id: 'aws', text: 'AWS' },
        { id: 'docker', text: 'Docker' },
        { id: 'kubernetes', text: 'Kubernetes' },
        { id: 'machine_learning', text: 'Machine Learning' },
        { id: 'data_science', text: 'Data Science' },
        { id: 'agile', text: 'Agile' },
        { id: 'devops', text: 'DevOps' },
        { id: 'team_lead', text: 'Team Lead Experience' },
        { id: 'project_management', text: 'Project Management' },
        { id: 'agile_methodology', text: 'Agile Methodology' },
        { id: 'cloud_experience', text: 'Cloud Experience' },
        { id: 'full_stack', text: 'Full Stack Development' },
        { id: 'ci_cd', text: 'CI/CD Experience' }
    ];

    $('#mustHaveKeywords').select2({
        data: keywordOptions,
        placeholder: 'Select skills and key phrases',
        allowClear: true,
        closeOnSelect: false,
        tags: false
    });

    ['resume', 'jd'].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', () => handleFileSelect(inputId));
        }
    });

    $('#uploadForm').on('submit', function(e) {
        e.preventDefault();
        submitForm(this);
    });

    $('[data-bs-toggle="tooltip"]').tooltip();
});

function handleFileSelect(inputId) {
    const input = document.getElementById(inputId);
    const fileArea = input.closest('.upload-area');
    const file = input.files[0];

    if (file) {
        const isResume = inputId === 'resume';
        const uploadArea = document.createElement('div');
        uploadArea.className = 'upload-area' + (isResume ? ' mb-3' : '');
        
        const selectedFileDiv = document.createElement('div');
        selectedFileDiv.className = 'selected-file';
        selectedFileDiv.innerHTML = `
            <div class="file-info">
                <i class="bi bi-file-earmark-${isResume ? 'person' : 'text'} text-primary"></i>
                <span class="ms-2">${file.name}</span>
            </div>
            <button type="button" class="btn-remove" onclick="removeFile('${inputId}')">
                <i class="bi bi-x-lg"></i>
            </button>`;
        
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.id = inputId;
        hiddenInput.name = inputId;
        hiddenInput.accept = '.pdf,.docx,.txt';
        hiddenInput.required = true;
        hiddenInput.style.display = 'none';
        
        uploadArea.appendChild(selectedFileDiv);
        uploadArea.appendChild(hiddenInput);
        
        fileArea.replaceWith(uploadArea);
        
        hiddenInput.files = input.files;
        hiddenInput.addEventListener('change', () => handleFileSelect(inputId));
    }
}

function removeFile(inputId) {
    const isResume = inputId === 'resume';
    const uploadArea = document.createElement('div');
    uploadArea.className = 'upload-area' + (isResume ? ' mb-3' : '');
    uploadArea.innerHTML = `
        <i class="bi bi-file-earmark-${isResume ? 'person' : 'text'} display-4 text-primary mb-3"></i>
        <h5>Upload ${isResume ? 'Resume' : 'Job Description'}</h5>
        <p class="text-muted small">PDF, DOCX, or TXT</p>
        <input type="file" id="${inputId}" name="${inputId}" accept=".pdf,.docx,.txt" required>`;

    const currentArea = document.getElementById(inputId).closest('.upload-area');
    currentArea.replaceWith(uploadArea);

    const newInput = document.getElementById(inputId);
    newInput.addEventListener('change', () => handleFileSelect(inputId));
}

function submitForm(form) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    
    const formData = new FormData(form);
    const keywords = $('#mustHaveKeywords').val() || [];
    formData.append('must_have_keywords', JSON.stringify(keywords));
    formData.append('experience_level', $('#experienceLevel').val());
    
    $.ajax({
        url: '/analyze',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(data) {
            if (data.error) {
                showError(data.error);
                return;
            }
            updateResults(data);
            showResultsView();
        },
        error: function(xhr, status, error) {
            showError('An error occurred during analysis');
            console.error(error);
        },
        complete: function() {
            loadingOverlay.style.display = 'none';
        }
    });
}

function showError(message) {
    alert(message);
}

function updateResults(data) {
    updateScoreWithAnimation('overallScore', data.overall_match);
    updateScoreWithAnimation('similarityScore', data.similarity_score);
    updateScoreWithAnimation('skillScore', data.skill_match);
    
    const skillsContainer = document.getElementById('skillsFound');
    skillsContainer.innerHTML = data.skills_found.map(skill => 
        `<span class="skill-badge">${skill}</span>`
    ).join('');
    
    updatePointsList('matchingPoints', data.matching_points, true);
    updatePointsList('missingPoints', data.missing_points, false);
    
    updateSimilarRolesChart(data.similar_roles);
}

function updateScoreWithAnimation(elementId, score) {
    const element = document.getElementById(elementId);
    element.textContent = score + '%';
    element.closest('.stat-card').className = 'card stat-card ' + getScoreClass(score);
}

function getScoreClass(score) {
    if (score >= 75) return 'high-score';
    if (score >= 50) return 'medium-score';
    return 'low-score';
}

function updatePointsList(elementId, points, isMatching) {
    const container = document.getElementById(elementId);
    container.innerHTML = points.map(point => `
        <div class="point-item ${isMatching ? 'matching' : 'missing'}">
            <i class="bi bi-${isMatching ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'}"></i>
            <span class="ms-2">${point}</span>
        </div>
    `).join('');
}

function showResultsView() {
    document.getElementById('uploadView').style.display = 'none';
    document.getElementById('resultsView').style.display = 'block';
}

function showUploadView() {
    document.getElementById('resultsView').style.display = 'none';
    document.getElementById('uploadView').style.display = 'block';
}

let similarRolesChart = null;

function updateSimilarRolesChart(similarRoles) {
    if (similarRolesChart) {
        similarRolesChart.destroy();
    }

    const ctx = document.getElementById('similarRolesChart').getContext('2d');
    
    const labels = similarRoles.map(role => role.title);
    const data = similarRoles.map(role => role.match_percentage);

    similarRolesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Match Percentage',
                data: data,
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function downloadReport() {
    const data = {
        overallScore: document.getElementById('overallScore').textContent,
        similarityScore: document.getElementById('similarityScore').textContent,
        skillScore: document.getElementById('skillScore').textContent,
        skillsFound: Array.from(document.getElementById('skillsFound').children).map(el => el.textContent),
        matchingPoints: Array.from(document.getElementById('matchingPoints').children).map(el => el.textContent),
        missingPoints: Array.from(document.getElementById('missingPoints').children).map(el => el.textContent)
    };

    const reportContent = `
        Resume Analysis Report
        
        Overall Match: ${data.overallScore}
        Content Match: ${data.similarityScore}
        Skill Match: ${data.skillScore}
        
        Skills Found:
        ${data.skillsFound.join('\n')}
        
        Matching Points:
        ${data.matchingPoints.join('\n')}
        
        Areas for Improvement:
        ${data.missingPoints.join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-analysis-report.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}