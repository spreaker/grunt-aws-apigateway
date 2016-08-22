# Changes

#### 0.0.5 (2016-08-22)
* FIX: the `responseParameters` values in resource's method response should be boolean, used to specify whether the parameter is required. We currently always force it to `false`, in order to avoid any breaking change in the configuration format.

#### 0.0.4 (2015-12-04)
* FIX: `concurrent modification` error when creating resources

#### 0.0.3 (2015-12-03)
* First public release