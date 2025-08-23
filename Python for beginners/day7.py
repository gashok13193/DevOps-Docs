import argparse
import boto3
import os


parse = argparse.ArgumentParser(description="Upload a file to s3")

parse.add_argument("--bucket", required=True)
parse.add_argument("--file", required=True)

args = parse.parse_args()

s3 = boto3.client("s3")
file_name = os.path.basename(args.file)

try:
    s3.upload_file(args.file, args.bucket, file_name)

    print(f"Upload of {args.file} is successful to the bucket {args.bucket}")
except Exception as e:
    print(f"Upload of {args.file} is NOT Successful to the bucket {args.bucket}")

s3 = boto3.resource("s3")

for bucket in s3.buckets.all():
    print(bucket.name)