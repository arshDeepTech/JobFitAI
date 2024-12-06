let currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-bs-theme', currentTheme);

function toggleTheme() {
    const root = document.documentElement;
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Add transition class before changing theme
    root.classList.add('theme-transitioning');
    
    // Update theme
    root.setAttribute('data-bs-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    // Update icon with transition
    updateThemeIcon();
    
    // Remove transition class after animation
    setTimeout(() => {
        root.classList.remove('theme-transitioning');
    }, 300);
}

function updateThemeIcon() {
    const icon = document.querySelector('.theme-switch i');
    const newIcon = currentTheme === 'light' ? 'bi-moon-stars' : 'bi-sun-fill';
    
    // Fade out
    icon.style.opacity = '0';
    
    setTimeout(() => {
        // Update icon and fade in
        icon.className = `bi ${newIcon}`;
        icon.style.opacity = '1';
    }, 150);
}

$(document).ready(function() {
    initializeEnhancedUI();
    updateThemeIcon();
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
    
    // Simulate API response for testing (remove this in production)
    setTimeout(() => {
        const mockResponse = {
            overall_match: 85,
            similarity_score: 80,
            skill_match: 90,
            skills_found: ["Python", "JavaScript", "AWS", "React", "Node.js"],
            matching_points: [
                "Strong programming background",
                "Web development experience",
                "Cloud platform knowledge"
            ],
            missing_points: [
                "Kubernetes expertise needed",
                "More DevOps experience required"
            ],
            similar_roles: [
                {
                    title: "Senior Software Engineer",
                    match_percentage: 85,
                    required_skills: ["JavaScript", "Python", "AWS"],
                    experience_level: "5+ years"
                },
                {
                    title: "Full Stack Developer",
                    match_percentage: 82,
                    required_skills: ["React", "Node.js", "MongoDB"],
                    experience_level: "3-5 years"
                },
                {
                    title: "DevOps Engineer",
                    match_percentage: 78,
                    required_skills: ["Docker", "Kubernetes", "CI/CD"],
                    experience_level: "3-5 years"
                }
            ]
        };

        updateResults(mockResponse);
        showResultsView();
        loadingOverlay.style.display = 'none';
    }, 2000);

    // Uncomment this for actual API integration
    /*
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
    */
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
    
    const sampleRoles = [
        {
            title: "Software Engineer",
            match_percentage: 85,
            required_skills: ["JavaScript", "Python", "AWS"],
            experience_level: "3-5 years"
        },
        {
            title: "DevOps Engineer",
            match_percentage: 78,
            required_skills: ["Docker", "Kubernetes", "CI/CD"],
            experience_level: "3-5 years"
        },
        {
            title: "Full Stack Developer",
            match_percentage: 75,
            required_skills: ["React", "Node.js", "MongoDB"],
            experience_level: "2-4 years"
        }
    ];

    const similarRoles = data.similar_roles || sampleRoles;
    
    updateSimilarRolesChart(similarRoles);
    generateInsights(data);
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
    const limitedPoints = points.slice(0, 5).map(point => {
        return point.length > 80 ? point.substring(0, 77) + '...' : point;
    });

    container.innerHTML = limitedPoints.map(point => `
        <div class="point-item ${isMatching ? 'matching' : 'missing'} mb-2">
            <i class="bi bi-${isMatching ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'} me-2"></i>
            <span>${point}</span>
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
    
    // Add error checking and default values
    if (!Array.isArray(similarRoles) || similarRoles.length === 0) {
        // Display empty state or default chart
        similarRolesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No matching roles found'],
                datasets: [{
                    label: 'Match Percentage',
                    data: [0],
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 20,
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
        return;
    }

    // Sort roles by match percentage
    const sortedRoles = similarRoles.sort((a, b) => b.match_percentage - a.match_percentage);
    const labels = sortedRoles.map(role => role.title || 'Unnamed Role');
    const data = sortedRoles.map(role => role.match_percentage || 0);
    const backgroundColors = data.map(value => {
        if (value >= 80) return 'rgba(54, 179, 126, 0.8)';  // Green for high match
        if (value >= 60) return 'rgba(255, 171, 0, 0.8)';   // Yellow for medium match
        return 'rgba(255, 86, 48, 0.8)';                    // Red for low match
    });

    similarRolesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Match Percentage',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 20,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 600,
                        family: 'Inter'
                    },
                    bodyFont: {
                        size: 13,
                        family: 'Inter'
                    },
                    callbacks: {
                        label: function(context) {
                            const role = sortedRoles[context.dataIndex];
                            if (!role) return ['No data available'];
                            return [
                                `Match: ${role.match_percentage || 0}%`,
                                `Required Skills: ${(role.required_skills || []).slice(0,3).join(', ') || 'None'}`,
                                `Experience: ${role.experience_level || 'Not specified'}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'Inter'
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Inter'
                        },
                        callback: function(value) {
                            if (!labels || !labels[value]) return '';
                            const label = labels[value];
                            return label.length > 20 ? label.substr(0, 17) + '...' : label;
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

function initializeEnhancedUI() {
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Enhanced file upload preview
    const dropZones = document.querySelectorAll('.upload-area');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('upload-area-active');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('upload-area-active');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('upload-area-active');
            const input = zone.querySelector('input[type="file"]');
            const file = e.dataTransfer.files[0];
            if (file) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
                handleFileSelect(input.id);
            }
        });
    });

    // Enhanced Select2 initialization
    $('#mustHaveKeywords').select2({
        theme: 'modern',
        placeholder: 'Select required skills',
        allowClear: true,
        closeOnSelect: false,
        tags: false,
        maximumSelectionLength: 10,
        templateSelection: formatKeywordSelection,
        templateResult: formatKeywordOption
    });

    // Initialize theme icon opacity transition
    const themeIcon = document.querySelector('.theme-switch i');
    themeIcon.style.transition = 'opacity 0.15s ease';
    
    // Add aria-label based on current theme
    updateThemeButtonLabel();
}

function formatKeywordSelection(data) {
    if (!data.id) return data.text;
    return $(`<span><i class="bi bi-check2-circle me-1"></i>${data.text}</span>`);
}

function formatKeywordOption(data) {
    if (!data.id) return data.text;
    return $(`<span><i class="bi bi-tag me-2"></i>${data.text}</span>`);
}

function updateThemeButtonLabel() {
    const themeButton = document.querySelector('.theme-switch');
    themeButton.setAttribute('aria-label', 
        currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
    );
}

// Add this function to generate detailed insights
function generateInsights(data) {
    const insights = [
        {
            type: 'strength',
            icon: 'bi-star-fill',
            title: 'Key Strengths',
            content: `Strong match in ${data.skills_found.slice(0,3).join(', ')} with ${data.overall_match}% overall match.`
        },
        {
            type: 'opportunity',
            icon: 'bi-lightbulb-fill',
            title: 'Growth Areas',
            content: `Consider developing skills in ${data.missing_points.slice(0,2).join(', ')} to increase job fit.`
        },
        {
            type: 'market',
            icon: 'bi-graph-up',
            title: 'Market Alignment',
            content: `Your profile aligns well with ${data.similar_roles.length} related positions in the industry.`
        },
        {
            type: 'recommendation',
            icon: 'bi-arrow-up-circle-fill',
            title: 'Recommendations',
            content: generateRecommendations(data)
        }
    ];

    const insightsHTML = insights.map(insight => `
        <div class="insight-card mb-3">
            <div class="insight-header">
                <i class="bi ${insight.icon} me-2"></i>
                <h6 class="mb-0">${insight.title}</h6>
            </div>
            <div class="insight-content">
                ${insight.content}
            </div>
        </div>
    `).join('');

    document.getElementById('insightsContent').innerHTML = insightsHTML;
}

// Add this helper function for generating recommendations
function generateRecommendations(data) {
    const recommendations = [];
    
    // Skill gap analysis
    if (data.skill_match < 70) {
        recommendations.push("Focus on acquiring key technical skills listed in missing points");
    }
    
    // Experience level recommendation
    if (data.experience_match < 80) {
        recommendations.push("Consider gaining more hands-on experience in core areas");
    }
    
    // Career path suggestion
    const topRole = data.similar_roles[0];
    if (topRole && topRole.match_percentage > 80) {
        recommendations.push(`Strong alignment with ${topRole.title} roles - consider this career path`);
    }

    return recommendations.join('. ') + '.';
}