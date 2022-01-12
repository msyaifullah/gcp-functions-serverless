gcloud beta functions deploy pdfGeneratorNode --stage-bucket aa-pdf-bucket --trigger-http --memory=1024MB
functions deploy clientJWTNode --trigger-http
functions logs read --limit=50
