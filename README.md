gcloud auth application-default login

# Sample Curl
$ curl -X POST -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    -H "Content-Type: application/json; charset=utf-8" \
    "https://dialogflow.googleapis.com/v2beta1/projects/project-name/agent/intents" \
    --data "{
        'displayName': 'StartStopwatch',
        'priority': 500000,
        'mlEnabled': true,
        'trainingPhrases': [
            {
                'type': 'EXAMPLE',
                'parts': [
                    {
                        'text': 'start stopwatch'
                    }
                ]
            }
        ],
        'action': 'start',
        'messages': [
            {
                'text': {
                    'text': [
                        'Stopwatch started'
                    ]
                }
            }
        ],
    }"
