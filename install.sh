conda deactivate
conda env remove -n resume_matcher
conda create -n resume_matcher python=3.8 -y
conda activate resume_matcher

source activate resume_matcher

conda install pytorch==2.0.1 cpuonly -c pytorch

pip install -r requirements.txt