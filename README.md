# grunt-aws-apigateway

AWS API Gateway configuration through the web console takes lot of mouse clicks and is error prone. This grunt plugin allows to script the AWS API Gateway configuration.


### Install

```shell
npm install grunt-aws-apigateway --save-dev
```


### Features

What you **can** do:

- Create resources
- Configure resources _Method Request_, _Integration Request_, _Method Response_, _Integratin Response_
- Deploy changes to a stage

**Unsupported** features:

- Create models

**One time things** you should do by hand**:

- Create API
- Create stages (than the plugin will deploy the API to the configured stage)

**NOTE**: to ease the development of this plugin, each run it **deletes all resources** and re-create them. This mean that it doesn't apply differential changes and if you've already created some resources that are not part of plugin configuration, you will loose it at the first run.


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
