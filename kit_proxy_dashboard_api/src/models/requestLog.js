const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema({
  xedgelocation: {
    type: String,
    trim: true,
  },
  cip: {
    type: String,
    trim: true,
  },
  csmethod: {
    type: String,
    trim: true,
  },
  Host: {
    type: String,
    trim: true,
  },
  csuristem: {
    type: String,
    trim: true,
  },
  scstatus: {
    type: Number,
    trim: true,
  },
  csReferer: {
    type: String,
    trim: true,
  },
  csUserAgent: {
    type: String,
    trim: true,
  },
  csuriquery: {
    type: String,
    trim: true,
  },
  csCookie: {
    type: String,
    trim: true,
  },
  xedgeresulttype: {
    type: String,
    trim: true,
  },
  xedgerequestid: {
    type: String,
    trim: true,
  },
  xhostheader: {
    type: String,
    trim: true,
  },
  csprotocol: {
    type: String,
    trim: true,
  },
  xforwardedfor: {
    type: String,
    trim: true,
  },
  sslprotocol: {
    type: String,
    trim: true,
  },
  sslcipher: {
    type: String,
    trim: true,
  },
  xegeresponseresulttype: {
    type: String,
    trim: true,
  },
  csprotocolversion: {
    type: String,
    trim: true,
  },
  flestatus: {
    type: String,
    trim: true,
  },
  fleencryptedfields: {
    type: String,
    trim: true,
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
  csbytes: {
    type: Number,
    required: true,
  },
  scbytes: {
    type: Number,
    required: true,
  },
  timetaken: {
    type: Number,
    required: true,
  },
  logDate: {
    type: Date,
  },
  country: {
    type: String,
  },
  city: {
    type: String,
  },
  fileName: {
    type: String,
  },
});
const requestLog = mongoose.model(
  '624aca20b2a2cecb7cb032b4_timeseries',
  requestLogSchema
);
module.exports = requestLog;
