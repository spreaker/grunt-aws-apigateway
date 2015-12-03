# grunt-aws-apigateway

AWS API Gateway configuration through the web console takes lot of mouse clicks and is error prone. This grunt plugin allows you to script and automatically deploy your API Gateway configuration.


### Install

```shell
npm install grunt-aws-apigateway --save-dev
```


### Features

What you **can** do:

- Create API resources
- Configure resource's _Method Request_, _Integration Request_, _Method Response_, _Integration Response_
- Deploy API changes to a stage

What you **can't** do:

- Create models

**One time configuration** you should do by hand:

- Create a new API
- Create stages (once created, the plugin will deploy the API to the configured stage)

**NOTE**: to ease the development of this plugin, each run **deletes all resources** and re-creates them. This means that it doesn't apply differential changes and if you've already created some resources that are not part of plugin configuration, you will loose it at the first run. In other words, make sure the plugin configuration contains all resources of your API.


### Usage

The following usage example could look a bit "verbose" at a first glance. However, AWS API Gateway setup is pretty complex and the following `resources` structure tries to map a much close as possible the AWS API, in order to guarantee the same degree of flexibility.

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

grunt.registerTask(
    "deploy-api",
    "Deploy the API Gateway config",
    ["apigateway_deploy"]
);
```


### Syntax

TODO


### License

MIT
