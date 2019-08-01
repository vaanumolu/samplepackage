'use strict';

/* jshint -W024 */
/* jshint node: true */
/* jshint mocha: true */
/* jshint esversion: 6 */
/* jshint expr:true */

/**
 * Utility class to convert date and time formats
 */


class DateTimeFormatter {
  /**
   * Transforms the give time string to json format
   * Ex: Input string: 'Mon-Thu 10:30am-8:30pm, Fri 10:30am-9pm'
   *     Will be converted into,
   *      [{"day":"Mon","open":"1030","close":"2030"},
   *       {"day":"Tue","open":"1030","close":"2030"},
   *       {"day":"Fri","open":"1030","close":"2100"}]
   *
   * @param {string} storeHrsSource - intervals of times in 12hr format
   */
  static storeHoursTransformation(storeHrsSource) {
    const storeHrsArray = storeHrsSource.split(',');
    const storeOpHours = [];
    storeHrsArray.forEach((item) => {
      const daysAndTimeRange = item.trim().split(' ');
      const days = daysAndTimeRange[0];
      const time = daysAndTimeRange[1];
      const [startTime, closeTime] = time.split('-');
      const requiredDays = DateTimeFormatter.getRequiredDays(days);
      requiredDays.forEach((item2) => {
        const hours = {
          day: item2,
          open: DateTimeFormatter.convertTime12to24(startTime),
          close: DateTimeFormatter.convertTime12to24(closeTime)
        };

        storeOpHours.push(hours);
      });
    });
    const sss = JSON.stringify(storeOpHours);
    return sss;
  }

  /**
   * Converts 12 hr time format to 24 hr format (ex: from 4pm to 16)
   * If input is 'closed' or 'cl', it will return 'CLOSED'
   *
   * @param {string} time12h - Time string in 12h format (ex: 4pm)
   */
  static convertTime12to24(time12h) {
    let resHours;
    if (time12h !== undefined) {
      if (time12h.toLowerCase() === 'closed' || time12h.toLowerCase() === 'cl') {
        return 'CLOSED';
      }

      const time = time12h.substring(0, time12h.length - 2);
      const modifier = time12h.substring(time12h.length - 2);
      let [hours, minutes] = time.split(':');

      if (hours === '12') {
        hours = '00';
      } else if (hours.length === 1) {
        hours = `0${hours}`;
      }

      if (modifier.toLowerCase() === 'pm') {
        hours = parseInt(hours, 10) + 12;
      }

      if (minutes === undefined) {
        minutes = '00';
      }

      resHours = `${hours}${minutes}`;
    }
    return resHours;
  }

  /**
   * From range of dates, creates individual dates.
   *
   * @param {string} dateRange - range of dates (ex: Mon-Thu 10:30am-8:30pm)
   */
  static getRequiredDays(dateRange) {
    const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const [stDt, endDt] = dateRange.split('-');

    let enDt = endDt;
    if (enDt === undefined) {
      enDt = stDt;
    }

    const startDate = WEEK_DAYS.indexOf(stDt);
    const endDate = WEEK_DAYS.indexOf(enDt);
    const reqDays = [];
    if (startDate <= endDate) {
      for (let i = startDate; i <= endDate; i += 1) {
        reqDays.push(WEEK_DAYS[i]);
      }
    }
    return reqDays;
  }
}

module.exports = DateTimeFormatter;
