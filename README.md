# grunt-aws-apigateway

A grunt plugin to easily configure and deploy AWS API Gateway.


### Scope

AWS API Gateway configuration through the web console takes lot of mouse clicks and is error prone. This grunt plugin allows you to script and automatically deploy your API Gateway configuration.


### Install

```shell
npm install grunt-aws-apigateway --save-dev
```


### Usage

The following usage example could look a bit _verbose_ at a first glance. However, AWS API Gateway setup is pretty complex and the following `resources` structure tries to map as much close as possible the AWS API, in order to provide the same degree of flexibility.

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



### Configuration

The plugin config is made of 3 **required** properties:

- `restApiId` (your API Gateway id)
- `resources`
- `deployment`


#### `resources`

The `resources` property contains the configuration of all your API Resources. Resources are organized in a tree, the path *must* start with a `/` and each resource's full path is built concatenating together all parent resources paths.

Example - create `/tweets/trends` resource:
```js
{
    resources: {
        "/tweets": {
            "/trends": {}
        }
    }
}
```

Each resource can have zero or more **methods**. For each method you must define a request and response integration (ie. a AWS Lambda function).

Example - add `GET` method to `/tweets/trends` resource:
```js
{
    resources: {
        "/tweets": {
            "/trends": {
                methods: {
                    GET: {
                        integration: { /* Integration Request config */ },
                        responses: { /* Integration Response config */ }
                    }
                }
            }
        }
    }
}
```

The resource's **Integration Request config** must contain the integration `type` and `uri`, along with other optional settings (ie. `requestTemplates`).

Example - integrate a lambda function to `GET /tweets/trends`:
```js
integration: {
    type: "AWS",
    uri: "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:xxx:function:getUsers/invocations",
    integrationHttpMethod: "POST", // Lambda functions must be called with a POST
    credentials: undefined,
    requestParameters: {},
    cacheNamespace: undefined,
    cacheKeyParameters: [],
    requestTemplates: {
        "application/json": JSON.stringify({
            "filter": "$input.params('filter')"
        })
    }
}
```

The resource's **Integration Response config** is a map whose keys are the status codes, and the value is the configuration for each status code.

Example - integrate `200` and `400` response codes:
```js
responses: {
    200: {
        responseModels: {
            "application/json": "Empty"
        },
        responseParameters: {}
    },
    400: {
        selectionPattern: "error code: 400",
        responseTemplates: {
            "application/json": JSON.stringify({"error": "$input.path('$.errorMessage')"})
        },
        responseParameters: {}
    }
}
```


#### `deployment`

The last step of `apigateway_deploy` is to deploy all the changes to a stage. The configuration of this phase is made through the `deployment` property. `stageName` is the only required property.

```js
{
    deployment: {
        stageName: "prod",
        cacheClusterEnabled: false,
        cacheClusterSize: "1G"
        description: "",
        stageDescription: "",
        variables: []
    }
}
```


### Options

| Option                    | Description |
|-------------------------- | ----------- |
| `options.region`          | AWS region where you would like to deploy your API. |
| `options.accessKeyId`     | (_see below_)
| `options.secretAccessKey` | If you prefer to use hardcoded AWS credentials, you should both set `accessKeyId` and `secretAccessKey`. |
| `options.credentialsJSON` | If you prefer to use AWS credentials stored in a JSON file, you should set the JSON file path here ([file format](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Credentials_from_Disk)). |
| `options.profile`         | If you prefer to use a specific AWS credentials profile you can set it here. |



### Contributing

You're very welcome to contribute to this pluging, in case you spot any bug, or to add some missing features (ie. create models). Please do your best to:

- Keep the coding style
- Keep your code as much clean (and readable) as possible


### License

MIT
