'use strict';
const fs = require('fs');
const { readFileSync } = require('fs');
const requestLog = require('../models/requestLog');
const locationInfo = JSON.parse(readFileSync('./src/helper/edgeLocation.json'));

const getRequestLog = async (options, queryOptions) => {
  try {
    let query = requestLog.find(options);
    if (queryOptions) {
      if (queryOptions.select) query = query.select(queryOptions.select);
    }
    const docs = await query;
    return docs;
  } catch (err) {
    console.log(err);
  }
};

const bulkInsertRequestLog = async (rows, fileName) => {
  try {
    if (rows && rows.length > 0) {
      var chunkedArrays = chunkArray(rows);
      await Promise.all(
        chunkedArrays.map(async (rows) => {
          var docs = constructBulkObject(rows, fileName);
          `${new Date().toUTCString()} [INFO] - chunked bulk rows count:${
            docs.length
          }!`;
          await requestLog.insertMany(docs);
        })
      );
      console.info(
        `${new Date().toUTCString()} [INFO] - Bulk Insert Completed Successfully:!`
      );
    }
  } catch (err) {
    console.log(err);
  }
};
const constructBulkObject = (rows, fileName) => {
  var bulkRows = [];
  var i = 0;
  for (i = 0; i < rows.length; i++) {
    var locKey = rows[i].xedgelocation.substring(0, 3);
    var newRow = {
      ...rows[i],
      country: locationInfo[locKey] ? locationInfo[locKey].country : locKey,
      city: locationInfo[locKey] ? locationInfo[locKey].city : locKey,
      fileName: fileName,
      logDate: new Date(rows[i].date + ' ' + rows[i].time),
    };
    console.log(newRow.logDate);
    bulkRows.push(newRow);
  }
  return bulkRows;
};

const getAggregate1 = () => async () => {
  try {
    let currentDate = new Date();
    let fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const docs = await requestLog.aggregate([
      {
        // $project: {
        //   _id: 1,
        //   scbytes: 1,
        //   learnedWords_size: { $size: '$xedgeresulttype' },
        // },
        $match: {
          logDate: {
            $gte: fromDate,
            $lt: currentDate,
          },
        },
      },
      {
        $group: {
          _id: '$country',
          // scbytes: { $sum: '$scbytes' },
          // xedgeresulttype: { $sum: { $size: '$xedgeresulttype' } },
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    return docs;
  } catch (err) {
    console.log(err);
  }
};

// chunk the array based on the configured chunk size
const chunkArray = (objArray) => {
  var results = [];
  while (objArray.length) {
    results.push(objArray.splice(0, process.env.CHUNK_SIZE));
  }
  return results;
};

const getAggregate2 = async () => {
  try {
    let currentDate = new Date();
    let fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const docs = await requestLog.aggregate([
      {
        $match: {
          logDate: {
            $gte: fromDate,
            $lt: currentDate,
          },
        },
      },
      {
        $group: {
          _id: { country: '$country', scstatus: '$scstatus' },
        },
      },
      {
        $group: {
          _id: '$_id.country',
          // scstatus: '$_id.scstatus',
          count: {
            $sum: 1,
          },
        },
      },
    ]);
    return docs;
  } catch (err) {
    console.log(err);
  }
};
const getBaseAggregate = async (match, group, project, limit) => {
  try {
    let queryConstructs = [];
    if (match) {
      queryConstructs.push({ $match: match });
    }
    if (group) {
      queryConstructs.push({ $group: group });
    }
    if (project) {
      queryConstructs.push({ $project: project });
    }
    queryConstructs.push({ $limit: limit });
    const docs = await requestLog.aggregate(queryConstructs);
    return docs;
  } catch (err) {
    console.log(err);
  }
};

const getGroupData = async (
  fromDate,
  currentDate,
  fields,
  project,
  limit = 10
) => {
  try {
    let match = {};
    // let match = {
    //   logDate: {
    //     $gte: fromDate,
    //     $lt: currentDate,
    //   },
    // };
    // let match = {
    //   scstatus: { $in: ['200', '400', '500', '401', '403', '404'] },
    // };
    let group = {
      _id: fields,
      count: { $sum: 1 },
      timetaken: { $avg: '$timetaken' },
      scbytes: { $avg: '$scbytes' },
    };
    project._id = 0;
    project.count = '$count';
    project.timetaken = '$timetaken';
    project.scbytes = '$scbytes';
    const docs = await getBaseAggregate(match, group, project, limit);
    return docs;
  } catch (err) {
    console.log(err);
  }
};
const getFilteredGroupData = async (group, project, match, limit = 10) => {
  try {
    project._id = 0;
    project.count = '$count';
    // project.timetaken = '$timetaken';
    // project.scbytes = '$scbytes';
    const docs = await getBaseAggregate(match, group, project, limit);
    return docs;
  } catch (err) {
    console.log(err);
  }
};

const getSomething = async () => {
  try {
    let currentDate = new Date();
    let fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const docs = await requestLog.aggregate([
      {
        $bucket: {
          groupBy: '$scstatus',
          boundaries: [400, 401, 402, 403, 404, 405, 500, 501, 502, 503, 504],
          default: 'others',
          output: {
            count: {
              $sum: 1,
            },
          },
        },
      },
    ]);
    return docs;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getRequestLog,
  bulkInsertRequestLog,
  getAggregate1,
  getAggregate2,
  getSomething,
  getGroupData,
  getFilteredGroupData,
};
