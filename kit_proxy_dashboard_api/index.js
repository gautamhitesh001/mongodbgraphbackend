const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const morg = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const path = require('path');
const app = express();
const dbHelper = require('./src/helper/dbHelper');
require('dotenv').config();
// const uri =
//   'mongodb+srv://propathtech:P@$$w0rd@cluster0.utqsz.mongodb.net/test?retryWrites=true&w=majority';
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

app.use(morg('combined'));

app.use(express.static('public'));
app.use(
  express.json({
    limit: '100mb', // limit the size of the incoming data
    extended: true, // allow to parse nested objects
    parameterLimit: 100000, // limit the number of parameters
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(compression());
app.use(cookieParser());
app.use(
  cors({
    origin: '*',
    methods: '*',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-TOKEN',
    ],
    credentials: true,
  })
);
app.options('*', cors());
mongoose.connect(
  process.env.MONGO_DB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.info('Connected to MongoDB 📌...');
  }
);
app.get('/api', async (req, res) => {
  //console.log(encryptStringWithRsaPublicKey());
  //res.send('you are accessing the default page');
  let filter = {
    logDate: {
      $gte: new Date('2022-08-21T02:21:00'),
      $lte: new Date('2022-08-23T19:21:00'),
    },
  };
  result = await dbHelper.getRequestLog(filter, null);
  res.send(result);
});

app.get('/api/dashboard1', async (req, res) => {
  let currentDate = new Date();
  let fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 60);
  let filter = {
    logDate: {
      $gte: fromDate,
      $lte: currentDate,
    },
  };
  result = await dbHelper.getRequestLog(filter, {
    select: {
      scstatus: 1,
      sslprotocol: 1,
      logDate: 1,
      country: 1,
      city: 1,
      scbytes: 1,
      csbytes: 1,
      csmethod: 1,
      xedgelocation: 1,
    },
  });
  res.send(result);
});

app.post('/api/dashboard2', async (req, res) => {
  let filter = {
    logDate: {
      $gte: new Date(req.body.filter.logDate.start),
      $lte: new Date(req.body.filter.logDate.end),
    },
  };
  result = await dbHelper.getRequestLog(filter, req.body.queryOptions);
  res.send(result);
});

app.get('/api/agg', async (req, res) => {
  let currentDate = new Date();
  let fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 60);
  let filter = {
    logDate: {
      $gte: fromDate,
      $lte: currentDate,
    },
  };
  result = await dbHelper.getAggregate();
  res.send(result);
});

app.get('/api/avg1', async (req, res) => {
  let result = await dbHelper.getSomething();
  res.send(result);
});

app.get('/api/aggregate', async (req, res) => {
  console.log(req);
  let fields = {};
  let project = {};
  let field1 = req.query.field1;
  let field2 = req.query.field2;
  let field3 = req.query.field3;
  if (field1) {
    fields[field1] = '$' + field1;
    project[field1] = '$_id.' + field1;
  }
  if (field2) {
    fields[field2] = '$' + field2;
    project[field2] = '$_id.' + field2;
  }
  if (field3) {
    fields[field3] = '$' + field3;
    project[field3] = '$_id.' + field3;
  }
  let currentDate = new Date();
  let fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);

  let result = await dbHelper.getGroupData(
    fromDate,
    currentDate,
    fields,
    project,
    15000
  );
  res.send(result);
});

app.post('/api/aggregateFilter', async (req, res) => {
  console.log(req);
  let query = req.body.query;
  let selectFields = query.selectFields;
  let fields = {};
  let project = {};

  if (selectFields) {
    selectFields.forEach((field) => {
      let aggregateObject = {};
      if (field.aggregateType) {
        aggregateObject['$' + field.aggregateType] = '$' + field.field;
        fields[field.field] = aggregateObject;
      } else {
        fields[field.field] = '$' + field.field;
      }
      project[field.field] = '$_id.' + field.field;
    });
  }

  let group = {
    _id: fields,
    count: { $sum: 1 },
  };

  // let aggregateFields = query.aggregateFields;
  // if (aggregateFields) {
  //   aggregateFields.forEach((aggregateField) => {
  //     let aggregate = {};
  //     aggregate['$' + aggregateField.aggregateType] =
  //       '$' + aggregateField.field;
  //     group[aggregateField.field] = aggregate;
  //     project[aggregateField.field] = '$' + aggregateField.field;
  //   });
  // }

  let conditions = [];

  buildMatchConditions();

  let match;
  if (conditions.length > 0) {
    match = { $and: conditions };
  }

  console.log(match);
  let result = await dbHelper.getFilteredGroupData(
    group,
    project,
    match,
    15000
  );
  res.send(result);

  function buildMatchConditions() {
    let inFilter = query.inFilter;
    if (inFilter) {
      let inFilterCondition = {};
      let inField = inFilter.field;
      let inOperator = '$in';
      let values = inFilter.values;
      let inFieldRanges = {};
      inFieldRanges[inOperator] = values;
      inFilterCondition[inField] = inFieldRanges;
      conditions.push(inFilterCondition);
    }

    let rangeFilter = query.rangeFilter;
    if (rangeFilter) {
      let rangeCondition = {};
      let fieldRanges = {};
      let rangeField = rangeFilter.field;
      let operator1 = '$' + rangeFilter.operator1;
      let startValue = rangeFilter.startValue;
      let operator2 = '$' + rangeFilter.operator2;
      let endValue = rangeFilter.endValue;
      fieldRanges[operator1] = new Date(startValue);
      fieldRanges[operator2] = new Date(endValue);
      rangeCondition[rangeField] = fieldRanges;
      conditions.push(rangeCondition);
    }

    let singleFilter = query.singleFilter;
    if (singleFilter) {
      let singleCondition = {};
      let singleField = singleFilter.field;
      let operator = '$' + singleFilter.operator;
      let value = singleFilter.value;
      let singleFieldObject = {};
      singleFieldObject[operator] = value;
      singleCondition[singleField] = singleFieldObject;
      conditions.push(singleCondition);
    }
  }
});

app.post('/api/bulkInsert', async (req, res) => {
  result = await dbHelper.bulkInsertRequestLog(req.rows, req.fileName);
  res.send(result);
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log('listening on port 3002');
});
