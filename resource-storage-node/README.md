functions start
functions stop

functions deploy resourceStorageNode --trigger-http

gcloud beta functions deploy upload-profiles  --entry-point resourceStorageNode --stage-bucket ms-ruangimaji-lab-gfunctions-resource --trigger-http --memory=512MB



# sample
https://cloud.google.com/functions/docs/calling/storage
gcloud functions deploy helloGCSGeneric --runtime nodejs6 --trigger-resource YOUR_TRIGGER_BUCKET_NAME --trigger-event google.storage.object.finalize