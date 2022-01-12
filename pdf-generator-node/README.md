npm install
functions start
functions deploy pdfGeneratorNode --trigger-http


gcloud beta functions deploy pdfGeneratorNode --stage-bucket ms-pdf-bucket --trigger-http --memory=512MB
