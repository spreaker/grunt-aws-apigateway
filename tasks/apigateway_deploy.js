var AWS   = require('aws-sdk');
var async = require("async");
var _     = require("underscore");


module.exports = function (grunt) {

    // Globals
    var apigateway, restApiId;

    /**
     * Returns a map containing all resources defined in the input setup,
     * at the root level.
     *
     * @param  {Object} setup
     * @return {Object}
     */
    function _getResourcesFromSetup(setup) {
        var resources = {};

        _(setup).each(function(value, key) {
            if (key[0] === "/") {
                resources[key] = value;
            }
        });

        return resources;
    }

    /**
     * @param  {Object}   resource
     * @param  {String}   method
     * @param  {String}   status
     * @param  {Object}   responseSetup
     * @param  {Function} callback
     */
    function _createResourceIntegrationResponse(resource, method, status, responseSetup, callback) {
        grunt.log.verbose.writeln(resource.path + " " + method + " - Create integration response for status code " + status);

        // Prepare request (with defaults)
        var params = {
            httpMethod        : method,
            resourceId        : resource.id,
            restApiId         : restApiId,
            statusCode        : status,
            responseParameters: responseSetup.responseParameters || {},
            responseTemplates : responseSetup.responseTemplates || {},
            selectionPattern  : responseSetup.selectionPattern || undefined
        };

        // Create integration
        apigateway.putIntegrationResponse(params, function(err) {
            callback(err ? new Error("Unable to create integration response " + status + " for resource " + method + " " + resource.path + ": " + err.message) : null);
        });
    }

    /**
     * @param  {Object}   resource
     * @param  {String}   method
     * @param  {String}   status
     * @param  {Object}   responseSetup
     * @param  {Function} callback
     */
    function _createResourceMethodResponse(resource, method, status, responseSetup, callback) {
        grunt.log.verbose.writeln(resource.path + " " + method + " - Create method response for status code " + status);

        // Prepare request (with defaults)
        var params = {
            httpMethod        : method,
            resourceId        : resource.id,
            restApiId         : restApiId,
            statusCode        : status,
            responseModels    : responseSetup.responseModels || {},
            // NOTE: Response  parameters  are  represented  as  a key/value  map,
            //       with a destination as the key and a Boolean flag as the value.
            //       The Boolean flag is used to specify whether the parameter is required.
            responseParameters: _(responseSetup.responseParameters || {}).mapObject(function() {
                return false;
            })
        };

        // Create method response
        apigateway.putMethodResponse(params, function(err) {
            callback(err ? new Error("Unable to create method response " + method + " for resource " + resource.path + ": " + err.message) : null);
        });
    }

    /**
     * Creates resource's request integration.
     *
     * @param  {Object}   resource
     * @param  {String}   method
     * @param  {Object}   integrationSetup
     * @param  {Function} callback
     */
    function _createResourceIntegrationRequest(resource, method, integrationSetup, callback) {
        grunt.log.verbose.writeln(resource.path + " " + method + " - Create integration request");

        // Prepare request (with defaults)
        var params = {
            httpMethod           : method,
            integrationHttpMethod: integrationSetup.integrationHttpMethod || "POST",
            resourceId           : resource.id,
            restApiId            : restApiId,
            type                 : integrationSetup.type,
            requestTemplates     : integrationSetup.requestTemplates || {},
            credentials          : integrationSetup.credentials || undefined,
            requestParameters    : integrationSetup.requestParameters || {},
            cacheNamespace       : integrationSetup.cacheNamespace || undefined,
            cacheKeyParameters   : integrationSetup.cacheKeyParameters || [],
            uri                  : integrationSetup.uri
        };

        // Create integration
        apigateway.putIntegration(params, function(err) {
            callback(err ? new Error("Unable to create integration request for " + method + " " + resource.path + ": " +  err.message) : null);
        });
    }

    /**
     * Creates resource's method request.
     *
     * @param  {Object}   resource
     * @param  {String}   method
     * @param  {Object}   methodSetup
     * @param  {Function} callback
     */
    function _createResourceMethodRequest(resource, method, methodSetup, callback) {
        grunt.log.verbose.writeln(resource.path + " " + method + " - Create method request");

        // Prepare request (with defaults)
        var params = {
            authorizationType: methodSetup.authorizationType || "NONE",
            httpMethod       : method,
            resourceId       : resource.id,
            restApiId        : restApiId,
            apiKeyRequired   : methodSetup.apiKeyRequired || false
        };

        async.series([
            function(done) {
                // Create method
                apigateway.putMethod(params, function(err) {
                    done(err ? new Error("Unable to create method request " + method + " for resource " + resource.path + ": " + err.message) : null);
                });
            },
            function(done) {
                // Create integration
                _createResourceIntegrationRequest(resource, method, methodSetup.integration, done);
            },
            function(done) {
                // Create method responses
                async.forEachOfSeries(methodSetup.responses || {}, function(responseSetup, status, innerDone) {
                    _createResourceMethodResponse(resource, method, status, responseSetup, innerDone);
                }, done);
            },
            function(done) {
                // Create integration responses
                async.forEachOfSeries(methodSetup.responses || {}, function(responseSetup, status, innerDone) {
                    _createResourceIntegrationResponse(resource, method, status, responseSetup, innerDone);
                }, done);
            }],
            callback
        );
    }

    /**
     * Creates a resource.
     *
     * @param  {String}   path
     * @param  {Object}   setup
     * @param  {Object}   parentResource
     * @param  {Function} callback
     */
    function _createResource(path, setup, parentResource, callback) {
        grunt.log.writeln((parentResource.path !== "/" ? parentResource.path : "") + path + " Create resource");

        // Prepare the request
        var params = {
            parentId : parentResource.id,
            pathPart : path.substring(1), // Remove the leading "/"
            restApiId: restApiId
        };

        apigateway.createResource(params, function(err, resource) {
            if (err) {
                return callback(new Error("Unable to create resource " + path + ": " + err.message));
            }

            // Create methods
            async.forEachOfSeries(setup.methods || {}, function(methodSetup, method, callback) {
                _createResourceMethodRequest(resource, method, methodSetup, callback);
            }, function(err) {
                callback(err, resource);
            });
        });
    }

    /**
     * @param {Object} setup
     * @param {Object} parentResources
     * @param {Function} callback
     */
    function _createResources(setup, parentResource, callback) {
        // Create each resource at this level
        async.forEachOfSeries(_getResourcesFromSetup(setup), function(setup, path, callback) {
            setTimeout(_createResource(path, setup, parentResource, function(err, resource) {
                if (err) {
                    return callback(err);
                }

                // Create sub-resources
                _createResources(setup, resource, callback);
            }),500);
        }, callback);
    }

    /**
     * Deletes a resource.
     *
     * @param  {Object} resource
     * @param  {Function} callback
     */
    function _deleteResource(resource, callback) {
        grunt.log.writeln("Delete resource: " + resource.path);

        var params = {
            resourceId: resource.id,
            restApiId: restApiId
        };

        apigateway.deleteResource(params, function(err, data) {
            // The resource could have already been deleted
            if (!err || err.message === "Invalid Resource identifier specified") {
                callback();
            } else {
                callback(new Error("Unable to delete a resource " + resource.path + ": " + err.message));
            }
        });
    }

    /**
     * Deploy the new API setup.
     *
     * @param  {Object} deploymentSetup
     * @param  {Function} callback
     */
    function _createDeployment(deploymentSetup, callback) {
        grunt.log.writeln("Deploy to stage " + deploymentSetup.stageName);

        // Prepare request (with defaults)
        var params = {
            restApiId          : restApiId,
            stageName          : deploymentSetup.stageName,
            cacheClusterEnabled: deploymentSetup.cacheClusterEnabled || false,
            cacheClusterSize   : deploymentSetup.cacheClusterSize || undefined,
            description        : deploymentSetup.description || "",
            stageDescription   : deploymentSetup.stageDescription || "",
            variables          : deploymentSetup.variables || {}
        };

        // Create deployment
        apigateway.createDeployment(params, function(err) {
            callback(err ? new Error("Unable to deploy to stage " + deploymentSetup.stageName + ": " + err.message) : null);
        });
    }

    /**
     * Fetch all API resources currently configured on AWS API Gateway.
     *
     * @param  {Function} callback
     */
    function _getResources(callback) {
        apigateway.getResources({ restApiId: restApiId }, function(err, data) {
            if (err) {
                return callback(err);
            }

            callback(null, data.items);
        });
    }

    /**
     * @param {Object} resourcesSetup
     * @param {Object} deploymentSetup
     * @param {Function} callback
     */
    function _deploy(resourcesSetup, deploymentSetup, callback) {
        // Fetch current resources
        _getResources(function(err, resources) {
            if (err) {
                return callback(new Error("Unable to fetch API resources: " + err.message));
            }

            // Get root resource
            var rootResource = _(resources).find(function(value) {
                return value.path === "/";
            });

            if (!rootResource) {
                return callback(new Error("Unable to find root resource"));
            }

            async.series([
                function(done) {
                    // Delete all resources except root
                    async.each(_(resources).filter(function(resource) { return resource.path !== "/"; }), setTimeout(_deleteResource, 500), done);
                },
                function(done) {
                    // Create resources
                    _createResources(resourcesSetup, rootResource, done);
                },
                function(done) {
                    // Create deployment
                    _createDeployment(deploymentSetup, done);
                }
            ], callback);
        });
    }


    grunt.registerMultiTask('apigateway_deploy', 'Deploy an API Gateway setup', function () {

        // Required config
        grunt.config.requires('apigateway_deploy.' + this.target + '.restApiId');
        grunt.config.requires('apigateway_deploy.' + this.target + '.resources');
        grunt.config.requires('apigateway_deploy.' + this.target + '.deployment');

        // Options
        var options = this.options({
            profile        : null,
            accessKeyId    : null,
            secretAccessKey: null,
            credentialsJSON: null,
            region         : 'us-east-1'
        });

        // Init credentials
        if (options.profile) {
            var credentials = new AWS.SharedIniFileCredentials({ profile: options.profile });
            AWS.config.credentials = credentials;
        } else if (options.accessKeyId && options.secretAccessKey) {
            AWS.config.update({ accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey });
        } else if (options.credentialsJSON) {
            AWS.config.loadFromPath(options.credentialsJSON);
        }

        // Configure region and API versions
        AWS.config.update({ region: options.region });
        AWS.config.apiVersions = { apigateway: '2015-07-09' };

        // Get config
        restApiId           = grunt.config.get('apigateway_deploy.' + this.target + '.restApiId');
        var resourcesSetup  = grunt.config.get('apigateway_deploy.' + this.target + '.resources');
        var deploymentSetup = grunt.config.get('apigateway_deploy.' + this.target + '.deployment');

        // Init API Gateway
        apigateway = new AWS.APIGateway();

        // Deploy
        var done = this.async();

        _deploy(resourcesSetup, deploymentSetup, function(err) {
            if (err) {
                grunt.fail.warn(err.message);
            } else {
                grunt.verbose.ok();
                done(true);
            }
        });
    });

};
