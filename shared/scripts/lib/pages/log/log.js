'use strict';

import Component from '../../component';
import { select, selectAll } from '../../dom';
import storage from '../../storage';

/**
 * LogPage
 *
 * @return
 */
function LogPage() {
  Component.prototype.constructor.apply(this, arguments);

  // Set the columns.
  this.columns = ['Domain', 'Visit count', 'Time spent', 'Last time visited'];

  // Initially render table.
  this.renderTable();
}

LogPage.prototype = {
  template: 'pages/log/log.html',
  hideNoAuthor: false,
  searchTerm: null,

  events: {
    'click input[type=checkbox]': 'toggleNoAuthor',
    'keyup input[type=search]': 'search'
  },

  // Register these functions as filters.
  filters: [
    'timeSpent',
    'keyLength',
    'hasName',
    'lastAccess'
  ],

  /**
   * timeSpent
   *
   * @param val
   * @return
   */
  timeSpent: function(val) {
    return moment.duration(val.reduce(function(prev, current) {
      return prev + current.timeSpent;
    }, 0), 'milliseconds').humanize();
  },

  /**
   * keyLength
   *
   * @param val
   * @return
   */
  keyLength: function(val) {
    return Object.keys(val).length;
  },

  /**
   * hasName
   *
   * @param val
   * @return
   */
  hasName: function(val) {
    return val && val.name ? 'has' : 'no';
  },

  /**
   * lastAccess
   *
   * @param val
   * @return
   */
  lastAccess: function(val) {
    var date = new Date(val[val.length - 1].accessTime).toString();
    return moment(date).format("hA - ddd, MMM Do, YYYY");
  },

  /**
   * toggleNoAuthor
   *
   * @param ev
   * @return
   */
  toggleNoAuthor: function(ev) {
    this.hideNoAuthor = !ev.target.checked;
    this.renderTable();
  },

  /**
   * search
   *
   * @param ev
   * @return
   */
  search: function(ev) {
    this.searchTerm = ev.target.value;
    this.renderTable();
  },

  /**
   * toArray
   *
   * @param resp
   * @return
   */
  toArray: function(resp) {
    return Object.keys(resp).map(function(key) {
      return {
        host: key,
        entries: resp[key]
      };
    });
  },

  /**
   * filter
   *
   * @param entries
   * @return
   */
  filter: function(entry) {
    var authorCount = entry.entries.filter(function(entry) {
      return entry.author && entry.author.name;
    }).length;

    // Attach the number of authors to the entry, now that it's calculated.
    entry.authorCount = authorCount;

    // Hide or show entries without any author information.
    if (this.hideNoAuthor && !authorCount) {
      return false;
    }

    return true;
  },

  /**
   * sort
   *
   * @param entries
   * @return
   */
  sort: function(a, b) {
    a = a ? a.entries : [];
    b = b ? b.entries : [];

    var aAccessTime = a && a.length ? a[a.length - 1].accessTime : 0;
    var bAccessTime = b && b.length ? b[b.length - 1].accessTime : 0;

    return bAccessTime - aAccessTime;
  },

  /**
   * renderTable
   *
   * @return
   */
  renderTable: function() {
    var log = this;
    var data = {
      columns: this.columns,
      entries: []
    };

    // Render the empty table initially, as `storage.get` can take some time.
    this.render(data);

    // Render with the data found from the log.
    storage.get('log').then(function(resp) {
      var filteredAndSorted = log
        // Convert the log Object to a filterable/sortable Array.
        .toArray(resp)
        // Sort and filter passing along the log component instance as context.
        .filter(log.filter, log)
        .sort(log.sort, log);

      // If a search term is provided, search!
      if (log.searchTerm) {
        return new Fuse(filteredAndSorted, {
          threshold: 0.3,
          keys: ['host']
        }).search(log.searchTerm);
      }

      return filteredAndSorted;
    }).then(function(entries) {
      data.entries = entries;
      log.render(data);
    });
  }
};

LogPage.prototype.__proto__ = Component.prototype;

export default LogPage;
