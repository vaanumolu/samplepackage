const fs = require('fs');
const { assert } = require('chai');
const JSONPath = require('jsonpath');
const dateTimeFormat = require('./date-time-formatter');

class RuleEngine {
    /**
     * Executes the rules specified in mapping file
     *
     * @param {string} pipelineKey - name of the pipeline
     * @param {object} sourceObj - source file json object
     * @param {object} targetObj - target file json object
     * @param {callback} callback - callback method, will be executed on finish of this method execution
     */
    static executeRules(pipelineKey, sourceObj, targetObj, callback) {
      const rulesMappingFile = fs.readFileSync(`./tests/rules-mapping/${this.getMappingFileName(pipelineKey)}`, 'utf8');
      const mappingObj = JSON.parse(rulesMappingFile);
      let noOfComparisons = 0;
      // Object.keys(mappingObj.mapping).forEach((mappingKey) => {
      // console.log(`mapping ${JSON.stringify(mappingObj.mapping[pipelineKey])}`);
      noOfComparisons = mappingObj.mapping[pipelineKey].length;
      const compareObjList = mappingObj.mapping[pipelineKey];
      let mappingCount = 0;
      let sourcePathValue;
      let targetPathValue;
      compareObjList.forEach((compareObj) => {
        if (compareObj.method === 'pathbasedcompare') {
          mappingCount += 1;
          // console.log(`Comparing mapping between source and target values, mapping count# ${mappingCount}`);
          for (let j = 0; j < compareObj.rules.length; j += 1) {
            // console.log(`Executing rule, ${compareObj.rules[j].ruleName} for mapping`);
            sourcePathValue = RuleEngine.getPathValue(compareObj.source_path, compareObj, sourceObj, false);
            targetPathValue = RuleEngine.getPathValue(compareObj.target_path, null, targetObj, false);
            assert.equal(sourcePathValue.length, targetPathValue.length, `Mismatch in items size for ${compareObj.source_path}, the source and target items length should match`);
  
            switch (compareObj.rules[j].ruleName) {
              case 'equalValue':
                RuleEngine.compareTwoArraysData(sourcePathValue, targetPathValue, false);
                break;
              case 'equalValueAfterStripSpaces':
                RuleEngine.compareTwoArraysData(sourcePathValue, targetPathValue, true);
                break;
              default:
                callback(new Error('RuleEngine: No matching rules found to execute'));
            }
            if (noOfComparisons === mappingCount && compareObj.rules.length === j + 1) {
              callback(' ', 'completed');
            }
          }
        }
        if (compareObj.method === 'sameFile') {
          switch (compareObj.rules.ruleName) {
            case 'equalValue':
              RuleEngine.compareTwoArraysData(sourceObj, targetObj, true);
              break;
            default:
              callback(new Error('RuleEngine: No matching rules found to execute'));
          }
          if (noOfComparisons === mappingCount) {
            callback(' ', 'completed');
          }
        }
      });
    }
  
    /**
     * Compares the data of two arrays
     *
     * @param {Array} sourceData - Array of source data
     * @param {Array} targetData - Array of target data
     * @param {boolean} stripSpaces - flag to specify, compare data by stripping all the spaces
     */
    static compareTwoArraysData(sourceData, targetData, stripSpaces) {
      // let counter = 0;
      Object.keys(sourceData).forEach((key) => {
        // counter += 1;
        if (sourceData.hasOwnProperty(key)) {
          const srcValue = sourceData[key];
          const targetValue = targetData[key];
          // console.log(`Value from source and target files:  for row# ${counter}`);
          if (stripSpaces) {
            assert.equal(srcValue.split(' ').join(''), targetValue.split(' ').join(''), 'Mismatch in values of source and target files');
          } else {
            assert.equal(String(srcValue).trim(), String(targetValue).trim(), 'Mismatch in values of source and target files');
          }
        }
      });
    }
  
    /**
     * Get the value from Json object based on the given path type and path string
     *
     * @param {string} pathValueStr - path to retrieve the valud from json object
     * @param {object} compareObj - Comparison object which contains all the rules
     * @param {object} jsonObjs - Json object to get the value based on pathValueStr
     * @param {boolean} skipTransform - flag, to specifiy is transfomation rule is applied
     */
    static getPathValue(pathValueStr, compareObj, jsonObjs, skipTransform) {
      const pathValues = pathValueStr.split('|');
      let attrValue = [];
      if (pathValues !== null && pathValues.length > 1) {
        if (pathValues[1] === 'jsonpath') {
          attrValue = JSONPath.query(jsonObjs, pathValues[0]);
        } else if (pathValues[1] === 'path') {
          jsonObjs.forEach((obj) => {
            let srcVal = obj[pathValues[0]];
            if (!skipTransform) {
              srcVal = RuleEngine.transformData(compareObj, srcVal, obj);
            }
            attrValue.push(srcVal);
          });
        }
      }
      return attrValue;
    }
  
    /**
     * Apply transformation rules on given input
     *
     * @param {object} compareObj - Comparison object to apply transformation rules
     * @param {string} objValParam - Value on which transformation rule is to be applied
     * @param {object} dataObj - input data object
     */
    static transformData(compareObj, objValParam, dataObj) {
      let objVal = objValParam;
      if (typeof compareObj.transformation_rules !== 'undefined') {
        Object.keys(compareObj.transformation_rules).forEach((key) => {
          switch (key) {
            case 'removePreText': {
              const val = compareObj.transformation_rules.removePreText;
              const temp = [];
              temp.push(dataObj);
              const appendVal = RuleEngine.getPathValue(val, compareObj, temp, true);
              objVal = objVal.replace(appendVal, '');
              break;
            }
            case 'timeFormatChange': {
              const timeFormatPath = compareObj.transformation_rules.timeFormatChange;
              if (timeFormatPath !== undefined && timeFormatPath === 'storeHoursTransformation') {
                objVal = dateTimeFormat.storeHoursTransformation(objVal);
              }
              break;
            }
            default:
              break;
          }
        });
      }
      return objVal;
    }
  
    /**
     * Get the rules mapping file based on the given pipeline
     *
     * @param {string} pipelineKey - name of the pipeline
     */
    static getMappingFileName(pipelineKey) {
      let mappingFile;
      switch (pipelineKey) {
        case 'pricebook':
          mappingFile = 'pricebook_rules_mapping.json';
          break;
        case 'storelist':
          mappingFile = 'storelist_rules_mapping.json';
          break;
        case 'inventoryList':
          mappingFile = 'inventory_rules_mapping.json';
          break;
        case 'autoreservationallocation':
          mappingFile = 'autoreservationallocation_rules_mapping.json';
          break;
        default:
          break;
      }
      return mappingFile;
    }
  }

  module.exports = RuleEngine;
