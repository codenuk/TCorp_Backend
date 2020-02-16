// Required Imports
const express   = require('express');
const apiRouter = express.Router(mergeParams=true);

// All the child routers defined
const projectsRouter             = require('./projects.js');
const usersRouter                = require('./users.js');
const taskStatusesRouter         = require('./tasks_statuses.js');
const customersRouter            = require('./customers.js');
const projectCategoriesRouter    = require('./project_categories.js');
const billingConfigurationRouter = require('./billing_configurations.js');
const boqRouter                  = require('./bill_of_quantity.js');
const productsRouter             = require('./products.js');
const suppliersRouter            = require('./suppliers.js');
const productCategoriesRouter    = require('./product_categories.js');
const logBoqsRouter              = require('./log_boqs.js');

apiRouter.get('/', (req, res) => {
    res.send({
      message: 'Hello from the API',
    });
  });


apiRouter.use('/projects',               projectsRouter);
apiRouter.use('/users',                  usersRouter);
apiRouter.use('/tasks_status',           taskStatusesRouter);
apiRouter.use('/customers',              customersRouter);
apiRouter.use('/project_categories',     projectCategoriesRouter);
apiRouter.use('/billing_configurations', billingConfigurationRouter);
apiRouter.use('/boqs',                   boqRouter);
apiRouter.use('/products',               productsRouter);
apiRouter.use('/suppliers',              suppliersRouter);
apiRouter.use('/product_categories',     productCategoriesRouter);
apiRouter.use('/log_boqs',               logBoqsRouter);

module.exports = apiRouter;
