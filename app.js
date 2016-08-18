/*global jQuery, Handlebars, Router */
jQuery(function ($) {
  'use strict';

// Line 2 ($) allows you to use jQuery inside this particular function without
//interfering with other libraries

//* Strict Mode

  Handlebars.registerHelper('eq', function (a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  // This makes helpers specific to Handlebars (a function in this case) accesible by
  // templates (such as HTML).

  // Line 11 is an if else statement that says Does A equal B? The fn returns if the statement is true and the inverse returns if the statement is false.

  var ENTER_KEY = 13;
  var ESCAPE_KEY = 27;

  // You are setting up variables for the enter and escape keys that
  // assign numerical values.

  var ajax = {
    baseUrl: 'https://fathomless-woodland-51903.herokuapp.com/todos',
    headers: {
      'Authorization': 'Token token=supadupasecret'
    },
    getJSON: function (callback) {
      $.getJSON({
        url: this.baseUrl,
        headers: this.headers,
        success: function (response) {
          callback(response.data)
        }
      })
    },

    // Headers are information that is needed to interact with the API.
    // This one includes an authorization.
    // JSON is data from the server.
//  The function is what happens when the getJSON is successful.
//  The function is returning the data from the response.

    create: function (value, callback) {
      $.post({
        url: this.baseUrl,
        headers: this.headers,
        data: { todo: { todo: value } },
        success: function (response) {
          callback(response.data)
        }
      })
    },

// The create function takes a value and a callback.
// .post is posting the value of the todo (what the user is entering in the input)

    destroy: function (todo) {
      if(todo.id.includes('-'))
        return;
      $.ajax({
        type: "DELETE",
        url: `${this.baseUrl}/${todo.id}`,
        headers: this.headers
      });
    },

    // This function deletes to do items of a particular id from the server.
    // If the todo id includes a dash, return nothing.


    update: function (todo) {
      if(todo.id.includes('-'))
        return;
      $.ajax({
        type: "PUT",
        url: `${this.baseUrl}/${todo.id}`,
        headers: this.headers,
        data: {
          todo: {
            todo: todo.title,
            isComplete: todo.completed
          }
        }
      });
    }

    // This ajax function is putting the todo item and its status into the data.

  };

  var util = {
    uuid: function () {
      /*jshint bitwise:false */
      var i, random;
      var uuid = '';

      for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;
        if (i === 8 || i === 12 || i === 16 || i === 20) {
          uuid += '-';
        }
        uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
      }

// The util object contains a function that gives each task a unique id.
// The uuid is being set to an empty string.
// The for loop is incrementing i by 1.
// The random method is multiplying a random number by 16 OR 0.
// If i is 8, 12, 16, or 20 it is adding a dash to the id.
// What follows is another if else statement that is added to the id and itself.
// It is being turned into a hexadecimal string.

      return uuid;
    },
    pluralize: function (count, word) {
      return count === 1 ? word : word + 's';
    },
    store: function (namespace, data) {
      if (arguments.length > 1) {
        return localStorage.setItem(namespace, JSON.stringify(data));
      } else {
        var store = localStorage.getItem(namespace);
        return (store && JSON.parse(store)) || [];
      }
    }
  };

  /* The pluralize method is using word or words depending on whether count is more than one.
  The store function is an if else statement that says if the length of arguments is greater than one, then it sets the item in local storage as a JSON string.
  If not, it either parses a string as JSON or returns an array.

  */



  var App = {
    init: function () {
      this.todos = util.store('todos-jquery');
      this.todoTemplate = Handlebars.compile($('#todo-template').html());
      this.footerTemplate = Handlebars.compile($('#footer-template').html());
      this.bindEvents();
      ajax.getJSON(this.integrateList.bind(this));

      var router = new Router({
        '/:filter': (filter) => this.renderFiltered(filter)
      })
      router.init('/all');
    },

    /* init initializes the App with the following data.
    Handlebars is compiling templates as HTML by referencing their element ids.
    The bind events function is being called.
    The bind method is being called with the context of "this" for the integrateList function.
    The router variable is creating a router that will allow for filtering of the todo items.
    /all represents all the todos.
    */
    bindEvents: function () {
      $('#new-todo').on('keyup', e => this.create(e));
      $('#toggle-all').on('change', e => this.toggleAll(e));
      $('#footer').on('click', '#clear-completed', e => destroyCompleted(e));
      $('#todo-list')
      .on('change', '.toggle', e => this.toggle(e))
        .on('dblclick', 'label', e => this.edit(e))
        .on('keyup', '.edit', e => this.editKeyup(e))
        .on('focusout', '.edit', e => this.update(e))
        .on('click', '.destroy', e => this.destroy(e));
    },

    /* bindEvents is binding "this" to multiple click, dblclick, change, and keyup events.
    */
    renderFiltered: function(filter){
      this.filter = filter;
      this.render();
    },

    render: function () {
      var todos = this.getFilteredTodos();
      $('#todo-list').html(this.todoTemplate(todos));
      $('#main').toggle(todos.length > 0);
      $('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
      this.renderFooter();
      $('#new-todo').focus();
      util.store('todos-jquery', this.todos);
    },

    /* This renders the function.

     Bind an event handler to the "focus" JavaScript event, or trigger that event on an element.
    */
    renderFooter: function () {
      var todoCount = this.todos.length;
      var activeTodoCount = this.getActiveTodos().length;
      var template = this.footerTemplate({
        activeTodoCount: activeTodoCount,
        activeTodoWord: util.pluralize(activeTodoCount, 'item'),
        completedTodos: todoCount - activeTodoCount,
        filter: this.filter
      });

/*
This includes a variable that represents the number of todos.
This count is located in the footer.
There are active todos and inactive todos if they have been completed.
completedTodos represents the count minus the active todos showing what we see if the footer in the html - how many todos remain.
*/

      $('#footer').toggle(todoCount > 0).html(template);
    },
    toggleAll: function (e) {
      var isChecked = $(e.target).prop('checked');

      this.todos.forEach(todo => {
        todo.completed = isChecked;
        ajax.update(todo);
      });

      /* You can only toggle the footer if there are todos greater than zero.
      The toggleAll checks off the todos when they are complete.
      */

      this.render();
    },
    getActiveTodos: function () {
      return this.todos.filter(todo => !todo.completed);
    },
    getCompletedTodos: function () {
      return this.todos.filter(todo => todo.completed);
    },
    getFilteredTodos: function () {
      if (this.filter === 'active') {
        return this.getActiveTodos();
      }

      if (this.filter === 'completed') {
        return this.getCompletedTodos();
      }

      /* The !todo.completed is reversing the true or false.
      */

      return this.todos;
    },
    destroyCompleted: function () {
      this.getCompletedTodos().forEach(todo => ajax.destroy(todo));
      this.todos = this.getActiveTodos();
      this.filter = 'all';
      this.render();
    },
    // accepts an element from inside the `.item` div and
    // returns the corresponding index in the `todos` array

    /* The destroy completed function is deleting the tasks from the server.
    */


    indexFromEl: function (el) {
      var id = String($(el).closest('li').data('id'));
      var todos = this.todos;
      var i = todos.length;

      while (i--) {
        if (todos[i].id === id) {
          return i;
        }
      }
    },

    /* id represents the closest list item's id.
    i represents how many todos are remaining.
    While the amount of todos is decrementing, if the id matches the id in the server then return the amount of todos.
    */
    create: function (e) {
      var $input = $(e.target);
      var val = $input.val().trim();



      if (e.which !== ENTER_KEY || !val) {
        return;
      }
      /* This clears the input after a task is submitted to the list.
      */

      var uuid = util.uuid();
      this.integrate(uuid, val);
      ajax.create(val, this.replace(uuid, this));

      /* This gives each todo a unique id.
      */

      $input.val('');

      this.render();
    },
    replace: (oldId, context) => {
      return (newTodo) => {
        var todo = context.todos.find((todo) => todo.id === oldId);
        todo.id = newTodo.id;
        util.store('todos-jquery', context.todos);
      }
    },

    /* This gives a new id to the todos.
    */
    toggle: function (e) {
      var i = this.indexFromEl(e.target);
      var todo = this.todos[i];
      todo.completed = !todo.completed;
      ajax.update(todo);
      this.render();
    },

    /* This is recognizing when a todo has changed from false to true
    and removing it from the array in the server.
    */
    edit: function (e) {
      var $input = $(e.target).closest('li').addClass('editing').find('.edit');
      $input.val($input.val()).focus();
    },
    editKeyup: function (e) {
      if (e.which === ENTER_KEY) {
        e.target.blur();
      }

      /* This is to edit a task in the list. It adds a class called editing to the task.
      .focus pulls up old input submission by clicking through in the input.
      */

      if (e.which === ESCAPE_KEY) {
        $(e.target).data('abort', true).blur();
      }
    },
    update: function (e) {
      var el = e.target;
      var $el = $(el);
      var val = $el.val().trim();

      if (!val) {
        this.destroy(e);
        return;
      }

      if ($el.data('abort')) {
        $el.data('abort', false);
      } else {
        var todo = this.todos[this.indexFromEl(el)];
        todo.title = val;
        ajax.update(todo);
      }

      /* .trim removes the whitespace from the start and end of strings.
      abort and destroy if else statements
      */

      this.render();
    },
    destroy: function (e) {
      var todo = this.todos.splice(this.indexFromEl(e.target), 1)[0];
      ajax.destroy(todo);
      this.render();
    },
    notIntegrated: function (todo) {
      return !this.todos.map((todo) => todo.id).includes(todo.id);
    },
    integrate: function (id, title, completed) {
      this.todos.push({
        id: id,
        title: title,
        completed: completed || false
      });
    },
    integrateList: function (data) {
      data.filter((todo) => this.notIntegrated(todo))
          .forEach(todo => this.integrate(todo.id,
                                          todo.attributes.id,
                                          todo.attributes['is-complete']));
      this.render();
    }
  };

  App.init();
});
