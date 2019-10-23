# Changes

#### 0.0.8 (2019-10-23)
* Updated dependencies (see PR [#6](https://github.com/spreaker/grunt-aws-apigateway/pull/6), thanks to [Matteo Rossi](https://github.com/teorossi82))

#### 0.0.7 (2016-09-20)
* FIX: `concurrent modification` error when creating methods (see PR [#5](https://github.com/spreaker/grunt-aws-apigateway/pull/5), thanks to [Tomas Romero](https://github.com/taromero))

#### 0.0.6 (2016-08-22)
* FIX: the `responseParameters` values in resource's method response should be boolean, used to specify whether the parameter is required. We currently always force it to `false`, in order to avoid any breaking change in the configuration format.

#### 0.0.4 (2015-12-04)
* FIX: `concurrent modification` error when creating resources

#### 0.0.3 (2015-12-03)
* First public release