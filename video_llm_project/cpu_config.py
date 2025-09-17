import os

# Disable GPU entirely
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Optimize for Intel CPUs
os.environ["KMP_AFFINITY"] = "granularity=fine,compact,1,0"
os.environ["KMP_BLOCKTIME"] = "1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "1"

# Thread control
NUM_THREADS = 4  # Set to your physical cores
os.environ["OMP_NUM_THREADS"] = str(NUM_THREADS)
os.environ["MKL_NUM_THREADS"] = str(NUM_THREADS)