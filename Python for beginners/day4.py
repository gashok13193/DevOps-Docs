import os
from datetime import datetime

### Create a folder and save the logs

log_dir = "/tmp/deployment/"

## checks wheather the folder exists or not and create folder

if not os.path.exists(log_dir):
    os.makedirs(log_dir)
    

log_file =  os.path.join(log_dir, f"deploy_{datetime.now().strftime('%d%m%y_%H%M%S')}.log")

with open(log_file, "w") as f:
    f.write("Deployment started now....\n") 
    f.write("App deployed Now successfully ... \n")
    
print(f"Logs written to : {log_file}")