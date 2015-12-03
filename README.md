# grunt-aws-apigateway

A grunt plugin to easily configure and deploy AWS API Gateway.


### Install

```shell
npm install grunt-aws-apigateway --save-dev
```

### Usage

```js
grunt.initConfig({
    apigateway_deploy: {
        options: {
            accessKeyId: "key",
            secretAccessKey: "secret",
            region: "us-east-1"
        },
        default: {
            restApiId: "xxx",
            deployment: {
                stageName: "prod"
            },
            resources: {
                "/users": {
                    methods: {
                        GET: {
                            integration: {
                                type: "AWS",
                                uri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:xxx:function:getUsers/invocations",
                                integrationHttpMethod: "POST",
                                requestTemplates: {
                                    "application/json": JSON.stringify({
                                        "filter": "$input.params('filter')"
                                    })
                                }
                            },
                            responses: {
                                200: {
                                    // Pass-through
                                    responseModels: {
                                        "application/json": "Empty"
                                    }
                                },
                                400: {
                                    selectionPattern: "error code: 400",
                                    responseTemplates: {
                                        "application/json": JSON.stringify({"error": "$input.path('$.errorMessage')"})
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

grunt.loadNpmTasks('grunt-aws-apigateway');
```


### License

MIT
