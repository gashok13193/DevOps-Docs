import boto3
import argparse
from urllib3.exceptions import InsecureRequestWarning
import warnings
# Get aws resources
# check the resource exists or not
# dryrun the commands

parse = argparse.ArgumentParser(description="Aws EBS volume deletion")

parse.add_argument("--dry-run",action="store_true", help="Preview the unused VOlumes")

args = parse.parse_args()

warnings.simplefilter("ignore",InsecureRequestWarning)
#### Boto3 ###########

ec2 = boto3.client("ec2", verify=False)

volumes= ec2.describe_volumes()

# print(ec2)
# print(volumes)
for vol in volumes["Volumes"]:
    if vol["State"] == "available":
        volume_id = vol["VolumeId"]
        size_gb = vol["Size"]
        
        print(f"Found the unused Volumes: {volume_id} ({size_gb} gb)")
        
        if args.dry_run:
            print(f"Would delete {volume_id}")
        else:
            ec2.delete_volume(VolumeId = volume_id)
            print(f"Deleteed the volume {volume_id}")