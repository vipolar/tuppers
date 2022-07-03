
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var bignumber = createCommonjsModule(function (module) {
    (function (globalObject) {

    /*
     *      bignumber.js v9.0.2
     *      A JavaScript library for arbitrary-precision arithmetic.
     *      https://github.com/MikeMcl/bignumber.js
     *      Copyright (c) 2021 Michael Mclaughlin <M8ch88l@gmail.com>
     *      MIT Licensed.
     *
     *      BigNumber.prototype methods     |  BigNumber methods
     *                                      |
     *      absoluteValue            abs    |  clone
     *      comparedTo                      |  config               set
     *      decimalPlaces            dp     |      DECIMAL_PLACES
     *      dividedBy                div    |      ROUNDING_MODE
     *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
     *      exponentiatedBy          pow    |      RANGE
     *      integerValue                    |      CRYPTO
     *      isEqualTo                eq     |      MODULO_MODE
     *      isFinite                        |      POW_PRECISION
     *      isGreaterThan            gt     |      FORMAT
     *      isGreaterThanOrEqualTo   gte    |      ALPHABET
     *      isInteger                       |  isBigNumber
     *      isLessThan               lt     |  maximum              max
     *      isLessThanOrEqualTo      lte    |  minimum              min
     *      isNaN                           |  random
     *      isNegative                      |  sum
     *      isPositive                      |
     *      isZero                          |
     *      minus                           |
     *      modulo                   mod    |
     *      multipliedBy             times  |
     *      negated                         |
     *      plus                            |
     *      precision                sd     |
     *      shiftedBy                       |
     *      squareRoot               sqrt   |
     *      toExponential                   |
     *      toFixed                         |
     *      toFormat                        |
     *      toFraction                      |
     *      toJSON                          |
     *      toNumber                        |
     *      toPrecision                     |
     *      toString                        |
     *      valueOf                         |
     *
     */


      var BigNumber,
        isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
        mathceil = Math.ceil,
        mathfloor = Math.floor,

        bignumberError = '[BigNumber Error] ',
        tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

        BASE = 1e14,
        LOG_BASE = 14,
        MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
        // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
        POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
        SQRT_BASE = 1e7,

        // EDITABLE
        // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
        // the arguments to toExponential, toFixed, toFormat, and toPrecision.
        MAX = 1E9;                                   // 0 to MAX_INT32


      /*
       * Create and return a BigNumber constructor.
       */
      function clone(configObject) {
        var div, convertBase, parseNumeric,
          P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
          ONE = new BigNumber(1),


          //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


          // The default values below must be integers within the inclusive ranges stated.
          // The values can also be changed at run-time using BigNumber.set.

          // The maximum number of decimal places for operations involving division.
          DECIMAL_PLACES = 20,                     // 0 to MAX

          // The rounding mode used when rounding to the above decimal places, and when using
          // toExponential, toFixed, toFormat and toPrecision, and round (default value).
          // UP         0 Away from zero.
          // DOWN       1 Towards zero.
          // CEIL       2 Towards +Infinity.
          // FLOOR      3 Towards -Infinity.
          // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
          // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
          // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
          // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
          // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
          ROUNDING_MODE = 4,                       // 0 to 8

          // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

          // The exponent value at and beneath which toString returns exponential notation.
          // Number type: -7
          TO_EXP_NEG = -7,                         // 0 to -MAX

          // The exponent value at and above which toString returns exponential notation.
          // Number type: 21
          TO_EXP_POS = 21,                         // 0 to MAX

          // RANGE : [MIN_EXP, MAX_EXP]

          // The minimum exponent value, beneath which underflow to zero occurs.
          // Number type: -324  (5e-324)
          MIN_EXP = -1e7,                          // -1 to -MAX

          // The maximum exponent value, above which overflow to Infinity occurs.
          // Number type:  308  (1.7976931348623157e+308)
          // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
          MAX_EXP = 1e7,                           // 1 to MAX

          // Whether to use cryptographically-secure random number generation, if available.
          CRYPTO = false,                          // true or false

          // The modulo mode used when calculating the modulus: a mod n.
          // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
          // The remainder (r) is calculated as: r = a - n * q.
          //
          // UP        0 The remainder is positive if the dividend is negative, else is negative.
          // DOWN      1 The remainder has the same sign as the dividend.
          //             This modulo mode is commonly known as 'truncated division' and is
          //             equivalent to (a % n) in JavaScript.
          // FLOOR     3 The remainder has the same sign as the divisor (Python %).
          // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
          // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
          //             The remainder is always positive.
          //
          // The truncated division, floored division, Euclidian division and IEEE 754 remainder
          // modes are commonly used for the modulus operation.
          // Although the other rounding modes can also be used, they may not give useful results.
          MODULO_MODE = 1,                         // 0 to 9

          // The maximum number of significant digits of the result of the exponentiatedBy operation.
          // If POW_PRECISION is 0, there will be unlimited significant digits.
          POW_PRECISION = 0,                       // 0 to MAX

          // The format specification used by the BigNumber.prototype.toFormat method.
          FORMAT = {
            prefix: '',
            groupSize: 3,
            secondaryGroupSize: 0,
            groupSeparator: ',',
            decimalSeparator: '.',
            fractionGroupSize: 0,
            fractionGroupSeparator: '\xA0',        // non-breaking space
            suffix: ''
          },

          // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
          // '-', '.', whitespace, or repeated character.
          // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
          ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz',
          alphabetHasNormalDecimalDigits = true;


        //------------------------------------------------------------------------------------------


        // CONSTRUCTOR


        /*
         * The BigNumber constructor and exported function.
         * Create and return a new instance of a BigNumber object.
         *
         * v {number|string|BigNumber} A numeric value.
         * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
         */
        function BigNumber(v, b) {
          var alphabet, c, caseChanged, e, i, isNum, len, str,
            x = this;

          // Enable constructor call without `new`.
          if (!(x instanceof BigNumber)) return new BigNumber(v, b);

          if (b == null) {

            if (v && v._isBigNumber === true) {
              x.s = v.s;

              if (!v.c || v.e > MAX_EXP) {
                x.c = x.e = null;
              } else if (v.e < MIN_EXP) {
                x.c = [x.e = 0];
              } else {
                x.e = v.e;
                x.c = v.c.slice();
              }

              return;
            }

            if ((isNum = typeof v == 'number') && v * 0 == 0) {

              // Use `1 / n` to handle minus zero also.
              x.s = 1 / v < 0 ? (v = -v, -1) : 1;

              // Fast path for integers, where n < 2147483648 (2**31).
              if (v === ~~v) {
                for (e = 0, i = v; i >= 10; i /= 10, e++);

                if (e > MAX_EXP) {
                  x.c = x.e = null;
                } else {
                  x.e = e;
                  x.c = [v];
                }

                return;
              }

              str = String(v);
            } else {

              if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

              x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
            }

            // Decimal point?
            if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

            // Exponential form?
            if ((i = str.search(/e/i)) > 0) {

              // Determine exponent.
              if (e < 0) e = i;
              e += +str.slice(i + 1);
              str = str.substring(0, i);
            } else if (e < 0) {

              // Integer.
              e = str.length;
            }

          } else {

            // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
            intCheck(b, 2, ALPHABET.length, 'Base');

            // Allow exponential notation to be used with base 10 argument, while
            // also rounding to DECIMAL_PLACES as with other bases.
            if (b == 10 && alphabetHasNormalDecimalDigits) {
              x = new BigNumber(v);
              return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
            }

            str = String(v);

            if (isNum = typeof v == 'number') {

              // Avoid potential interpretation of Infinity and NaN as base 44+ values.
              if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

              x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

              // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
              if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
                throw Error
                 (tooManyDigits + v);
              }
            } else {
              x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
            }

            alphabet = ALPHABET.slice(0, b);
            e = i = 0;

            // Check that str is a valid base b number.
            // Don't use RegExp, so alphabet can contain special characters.
            for (len = str.length; i < len; i++) {
              if (alphabet.indexOf(c = str.charAt(i)) < 0) {
                if (c == '.') {

                  // If '.' is not the first character and it has not be found before.
                  if (i > e) {
                    e = len;
                    continue;
                  }
                } else if (!caseChanged) {

                  // Allow e.g. hexadecimal 'FF' as well as 'ff'.
                  if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                      str == str.toLowerCase() && (str = str.toUpperCase())) {
                    caseChanged = true;
                    i = -1;
                    e = 0;
                    continue;
                  }
                }

                return parseNumeric(x, String(v), isNum, b);
              }
            }

            // Prevent later check for length on converted number.
            isNum = false;
            str = convertBase(str, b, 10, x.s);

            // Decimal point?
            if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
            else e = str.length;
          }

          // Determine leading zeros.
          for (i = 0; str.charCodeAt(i) === 48; i++);

          // Determine trailing zeros.
          for (len = str.length; str.charCodeAt(--len) === 48;);

          if (str = str.slice(i, ++len)) {
            len -= i;

            // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
            if (isNum && BigNumber.DEBUG &&
              len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
                throw Error
                 (tooManyDigits + (x.s * v));
            }

             // Overflow?
            if ((e = e - i - 1) > MAX_EXP) {

              // Infinity.
              x.c = x.e = null;

            // Underflow?
            } else if (e < MIN_EXP) {

              // Zero.
              x.c = [x.e = 0];
            } else {
              x.e = e;
              x.c = [];

              // Transform base

              // e is the base 10 exponent.
              // i is where to slice str to get the first element of the coefficient array.
              i = (e + 1) % LOG_BASE;
              if (e < 0) i += LOG_BASE;  // i < 1

              if (i < len) {
                if (i) x.c.push(+str.slice(0, i));

                for (len -= LOG_BASE; i < len;) {
                  x.c.push(+str.slice(i, i += LOG_BASE));
                }

                i = LOG_BASE - (str = str.slice(i)).length;
              } else {
                i -= len;
              }

              for (; i--; str += '0');
              x.c.push(+str);
            }
          } else {

            // Zero.
            x.c = [x.e = 0];
          }
        }


        // CONSTRUCTOR PROPERTIES


        BigNumber.clone = clone;

        BigNumber.ROUND_UP = 0;
        BigNumber.ROUND_DOWN = 1;
        BigNumber.ROUND_CEIL = 2;
        BigNumber.ROUND_FLOOR = 3;
        BigNumber.ROUND_HALF_UP = 4;
        BigNumber.ROUND_HALF_DOWN = 5;
        BigNumber.ROUND_HALF_EVEN = 6;
        BigNumber.ROUND_HALF_CEIL = 7;
        BigNumber.ROUND_HALF_FLOOR = 8;
        BigNumber.EUCLID = 9;


        /*
         * Configure infrequently-changing library-wide settings.
         *
         * Accept an object with the following optional properties (if the value of a property is
         * a number, it must be an integer within the inclusive range stated):
         *
         *   DECIMAL_PLACES   {number}           0 to MAX
         *   ROUNDING_MODE    {number}           0 to 8
         *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
         *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
         *   CRYPTO           {boolean}          true or false
         *   MODULO_MODE      {number}           0 to 9
         *   POW_PRECISION       {number}           0 to MAX
         *   ALPHABET         {string}           A string of two or more unique characters which does
         *                                       not contain '.'.
         *   FORMAT           {object}           An object with some of the following properties:
         *     prefix                 {string}
         *     groupSize              {number}
         *     secondaryGroupSize     {number}
         *     groupSeparator         {string}
         *     decimalSeparator       {string}
         *     fractionGroupSize      {number}
         *     fractionGroupSeparator {string}
         *     suffix                 {string}
         *
         * (The values assigned to the above FORMAT object properties are not checked for validity.)
         *
         * E.g.
         * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
         *
         * Ignore properties/parameters set to null or undefined, except for ALPHABET.
         *
         * Return an object with the properties current values.
         */
        BigNumber.config = BigNumber.set = function (obj) {
          var p, v;

          if (obj != null) {

            if (typeof obj == 'object') {

              // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
              // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
              if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
                v = obj[p];
                intCheck(v, 0, MAX, p);
                DECIMAL_PLACES = v;
              }

              // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
              // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
              if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
                v = obj[p];
                intCheck(v, 0, 8, p);
                ROUNDING_MODE = v;
              }

              // EXPONENTIAL_AT {number|number[]}
              // Integer, -MAX to MAX inclusive or
              // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
              // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
              if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
                v = obj[p];
                if (v && v.pop) {
                  intCheck(v[0], -MAX, 0, p);
                  intCheck(v[1], 0, MAX, p);
                  TO_EXP_NEG = v[0];
                  TO_EXP_POS = v[1];
                } else {
                  intCheck(v, -MAX, MAX, p);
                  TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
                }
              }

              // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
              // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
              // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
              if (obj.hasOwnProperty(p = 'RANGE')) {
                v = obj[p];
                if (v && v.pop) {
                  intCheck(v[0], -MAX, -1, p);
                  intCheck(v[1], 1, MAX, p);
                  MIN_EXP = v[0];
                  MAX_EXP = v[1];
                } else {
                  intCheck(v, -MAX, MAX, p);
                  if (v) {
                    MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
                  } else {
                    throw Error
                     (bignumberError + p + ' cannot be zero: ' + v);
                  }
                }
              }

              // CRYPTO {boolean} true or false.
              // '[BigNumber Error] CRYPTO not true or false: {v}'
              // '[BigNumber Error] crypto unavailable'
              if (obj.hasOwnProperty(p = 'CRYPTO')) {
                v = obj[p];
                if (v === !!v) {
                  if (v) {
                    if (typeof crypto != 'undefined' && crypto &&
                     (crypto.getRandomValues || crypto.randomBytes)) {
                      CRYPTO = v;
                    } else {
                      CRYPTO = !v;
                      throw Error
                       (bignumberError + 'crypto unavailable');
                    }
                  } else {
                    CRYPTO = v;
                  }
                } else {
                  throw Error
                   (bignumberError + p + ' not true or false: ' + v);
                }
              }

              // MODULO_MODE {number} Integer, 0 to 9 inclusive.
              // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
              if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
                v = obj[p];
                intCheck(v, 0, 9, p);
                MODULO_MODE = v;
              }

              // POW_PRECISION {number} Integer, 0 to MAX inclusive.
              // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
              if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
                v = obj[p];
                intCheck(v, 0, MAX, p);
                POW_PRECISION = v;
              }

              // FORMAT {object}
              // '[BigNumber Error] FORMAT not an object: {v}'
              if (obj.hasOwnProperty(p = 'FORMAT')) {
                v = obj[p];
                if (typeof v == 'object') FORMAT = v;
                else throw Error
                 (bignumberError + p + ' not an object: ' + v);
              }

              // ALPHABET {string}
              // '[BigNumber Error] ALPHABET invalid: {v}'
              if (obj.hasOwnProperty(p = 'ALPHABET')) {
                v = obj[p];

                // Disallow if less than two characters,
                // or if it contains '+', '-', '.', whitespace, or a repeated character.
                if (typeof v == 'string' && !/^.?$|[+\-.\s]|(.).*\1/.test(v)) {
                  alphabetHasNormalDecimalDigits = v.slice(0, 10) == '0123456789';
                  ALPHABET = v;
                } else {
                  throw Error
                   (bignumberError + p + ' invalid: ' + v);
                }
              }

            } else {

              // '[BigNumber Error] Object expected: {v}'
              throw Error
               (bignumberError + 'Object expected: ' + obj);
            }
          }

          return {
            DECIMAL_PLACES: DECIMAL_PLACES,
            ROUNDING_MODE: ROUNDING_MODE,
            EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
            RANGE: [MIN_EXP, MAX_EXP],
            CRYPTO: CRYPTO,
            MODULO_MODE: MODULO_MODE,
            POW_PRECISION: POW_PRECISION,
            FORMAT: FORMAT,
            ALPHABET: ALPHABET
          };
        };


        /*
         * Return true if v is a BigNumber instance, otherwise return false.
         *
         * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
         *
         * v {any}
         *
         * '[BigNumber Error] Invalid BigNumber: {v}'
         */
        BigNumber.isBigNumber = function (v) {
          if (!v || v._isBigNumber !== true) return false;
          if (!BigNumber.DEBUG) return true;

          var i, n,
            c = v.c,
            e = v.e,
            s = v.s;

          out: if ({}.toString.call(c) == '[object Array]') {

            if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

              // If the first element is zero, the BigNumber value must be zero.
              if (c[0] === 0) {
                if (e === 0 && c.length === 1) return true;
                break out;
              }

              // Calculate number of digits that c[0] should have, based on the exponent.
              i = (e + 1) % LOG_BASE;
              if (i < 1) i += LOG_BASE;

              // Calculate number of digits of c[0].
              //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
              if (String(c[0]).length == i) {

                for (i = 0; i < c.length; i++) {
                  n = c[i];
                  if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
                }

                // Last element cannot be zero, unless it is the only element.
                if (n !== 0) return true;
              }
            }

          // Infinity/NaN
          } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
            return true;
          }

          throw Error
            (bignumberError + 'Invalid BigNumber: ' + v);
        };


        /*
         * Return a new BigNumber whose value is the maximum of the arguments.
         *
         * arguments {number|string|BigNumber}
         */
        BigNumber.maximum = BigNumber.max = function () {
          return maxOrMin(arguments, P.lt);
        };


        /*
         * Return a new BigNumber whose value is the minimum of the arguments.
         *
         * arguments {number|string|BigNumber}
         */
        BigNumber.minimum = BigNumber.min = function () {
          return maxOrMin(arguments, P.gt);
        };


        /*
         * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
         * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
         * zeros are produced).
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
         * '[BigNumber Error] crypto unavailable'
         */
        BigNumber.random = (function () {
          var pow2_53 = 0x20000000000000;

          // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
          // Check if Math.random() produces more than 32 bits of randomness.
          // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
          // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
          var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
           ? function () { return mathfloor(Math.random() * pow2_53); }
           : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
             (Math.random() * 0x800000 | 0); };

          return function (dp) {
            var a, b, e, k, v,
              i = 0,
              c = [],
              rand = new BigNumber(ONE);

            if (dp == null) dp = DECIMAL_PLACES;
            else intCheck(dp, 0, MAX);

            k = mathceil(dp / LOG_BASE);

            if (CRYPTO) {

              // Browsers supporting crypto.getRandomValues.
              if (crypto.getRandomValues) {

                a = crypto.getRandomValues(new Uint32Array(k *= 2));

                for (; i < k;) {

                  // 53 bits:
                  // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
                  // 11111 11111111 11111111 11111111 11100000 00000000 00000000
                  // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
                  //                                     11111 11111111 11111111
                  // 0x20000 is 2^21.
                  v = a[i] * 0x20000 + (a[i + 1] >>> 11);

                  // Rejection sampling:
                  // 0 <= v < 9007199254740992
                  // Probability that v >= 9e15, is
                  // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
                  if (v >= 9e15) {
                    b = crypto.getRandomValues(new Uint32Array(2));
                    a[i] = b[0];
                    a[i + 1] = b[1];
                  } else {

                    // 0 <= v <= 8999999999999999
                    // 0 <= (v % 1e14) <= 99999999999999
                    c.push(v % 1e14);
                    i += 2;
                  }
                }
                i = k / 2;

              // Node.js supporting crypto.randomBytes.
              } else if (crypto.randomBytes) {

                // buffer
                a = crypto.randomBytes(k *= 7);

                for (; i < k;) {

                  // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
                  // 0x100000000 is 2^32, 0x1000000 is 2^24
                  // 11111 11111111 11111111 11111111 11111111 11111111 11111111
                  // 0 <= v < 9007199254740992
                  v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                     (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                     (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

                  if (v >= 9e15) {
                    crypto.randomBytes(7).copy(a, i);
                  } else {

                    // 0 <= (v % 1e14) <= 99999999999999
                    c.push(v % 1e14);
                    i += 7;
                  }
                }
                i = k / 7;
              } else {
                CRYPTO = false;
                throw Error
                 (bignumberError + 'crypto unavailable');
              }
            }

            // Use Math.random.
            if (!CRYPTO) {

              for (; i < k;) {
                v = random53bitInt();
                if (v < 9e15) c[i++] = v % 1e14;
              }
            }

            k = c[--i];
            dp %= LOG_BASE;

            // Convert trailing digits to zeros according to dp.
            if (k && dp) {
              v = POWS_TEN[LOG_BASE - dp];
              c[i] = mathfloor(k / v) * v;
            }

            // Remove trailing elements which are zero.
            for (; c[i] === 0; c.pop(), i--);

            // Zero?
            if (i < 0) {
              c = [e = 0];
            } else {

              // Remove leading elements which are zero and adjust exponent accordingly.
              for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

              // Count the digits of the first element of c to determine leading zeros, and...
              for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

              // adjust the exponent accordingly.
              if (i < LOG_BASE) e -= LOG_BASE - i;
            }

            rand.e = e;
            rand.c = c;
            return rand;
          };
        })();


        /*
         * Return a BigNumber whose value is the sum of the arguments.
         *
         * arguments {number|string|BigNumber}
         */
        BigNumber.sum = function () {
          var i = 1,
            args = arguments,
            sum = new BigNumber(args[0]);
          for (; i < args.length;) sum = sum.plus(args[i++]);
          return sum;
        };


        // PRIVATE FUNCTIONS


        // Called by BigNumber and BigNumber.prototype.toString.
        convertBase = (function () {
          var decimal = '0123456789';

          /*
           * Convert string of baseIn to an array of numbers of baseOut.
           * Eg. toBaseOut('255', 10, 16) returns [15, 15].
           * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
           */
          function toBaseOut(str, baseIn, baseOut, alphabet) {
            var j,
              arr = [0],
              arrL,
              i = 0,
              len = str.length;

            for (; i < len;) {
              for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

              arr[0] += alphabet.indexOf(str.charAt(i++));

              for (j = 0; j < arr.length; j++) {

                if (arr[j] > baseOut - 1) {
                  if (arr[j + 1] == null) arr[j + 1] = 0;
                  arr[j + 1] += arr[j] / baseOut | 0;
                  arr[j] %= baseOut;
                }
              }
            }

            return arr.reverse();
          }

          // Convert a numeric string of baseIn to a numeric string of baseOut.
          // If the caller is toString, we are converting from base 10 to baseOut.
          // If the caller is BigNumber, we are converting from baseIn to base 10.
          return function (str, baseIn, baseOut, sign, callerIsToString) {
            var alphabet, d, e, k, r, x, xc, y,
              i = str.indexOf('.'),
              dp = DECIMAL_PLACES,
              rm = ROUNDING_MODE;

            // Non-integer.
            if (i >= 0) {
              k = POW_PRECISION;

              // Unlimited precision.
              POW_PRECISION = 0;
              str = str.replace('.', '');
              y = new BigNumber(baseIn);
              x = y.pow(str.length - i);
              POW_PRECISION = k;

              // Convert str as if an integer, then restore the fraction part by dividing the
              // result by its base raised to a power.

              y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
               10, baseOut, decimal);
              y.e = y.c.length;
            }

            // Convert the number as integer.

            xc = toBaseOut(str, baseIn, baseOut, callerIsToString
             ? (alphabet = ALPHABET, decimal)
             : (alphabet = decimal, ALPHABET));

            // xc now represents str as an integer and converted to baseOut. e is the exponent.
            e = k = xc.length;

            // Remove trailing zeros.
            for (; xc[--k] == 0; xc.pop());

            // Zero?
            if (!xc[0]) return alphabet.charAt(0);

            // Does str represent an integer? If so, no need for the division.
            if (i < 0) {
              --e;
            } else {
              x.c = xc;
              x.e = e;

              // The sign is needed for correct rounding.
              x.s = sign;
              x = div(x, y, dp, rm, baseOut);
              xc = x.c;
              r = x.r;
              e = x.e;
            }

            // xc now represents str converted to baseOut.

            // THe index of the rounding digit.
            d = e + dp + 1;

            // The rounding digit: the digit to the right of the digit that may be rounded up.
            i = xc[d];

            // Look at the rounding digits and mode to determine whether to round up.

            k = baseOut / 2;
            r = r || d < 0 || xc[d + 1] != null;

            r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
                  : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
                   rm == (x.s < 0 ? 8 : 7));

            // If the index of the rounding digit is not greater than zero, or xc represents
            // zero, then the result of the base conversion is zero or, if rounding up, a value
            // such as 0.00001.
            if (d < 1 || !xc[0]) {

              // 1^-dp or 0
              str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
            } else {

              // Truncate xc to the required number of decimal places.
              xc.length = d;

              // Round up?
              if (r) {

                // Rounding up may mean the previous digit has to be rounded up and so on.
                for (--baseOut; ++xc[--d] > baseOut;) {
                  xc[d] = 0;

                  if (!d) {
                    ++e;
                    xc = [1].concat(xc);
                  }
                }
              }

              // Determine trailing zeros.
              for (k = xc.length; !xc[--k];);

              // E.g. [4, 11, 15] becomes 4bf.
              for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

              // Add leading zeros, decimal point and trailing zeros as required.
              str = toFixedPoint(str, e, alphabet.charAt(0));
            }

            // The caller will add the sign.
            return str;
          };
        })();


        // Perform division in the specified base. Called by div and convertBase.
        div = (function () {

          // Assume non-zero x and k.
          function multiply(x, k, base) {
            var m, temp, xlo, xhi,
              carry = 0,
              i = x.length,
              klo = k % SQRT_BASE,
              khi = k / SQRT_BASE | 0;

            for (x = x.slice(); i--;) {
              xlo = x[i] % SQRT_BASE;
              xhi = x[i] / SQRT_BASE | 0;
              m = khi * xlo + xhi * klo;
              temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
              carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
              x[i] = temp % base;
            }

            if (carry) x = [carry].concat(x);

            return x;
          }

          function compare(a, b, aL, bL) {
            var i, cmp;

            if (aL != bL) {
              cmp = aL > bL ? 1 : -1;
            } else {

              for (i = cmp = 0; i < aL; i++) {

                if (a[i] != b[i]) {
                  cmp = a[i] > b[i] ? 1 : -1;
                  break;
                }
              }
            }

            return cmp;
          }

          function subtract(a, b, aL, base) {
            var i = 0;

            // Subtract b from a.
            for (; aL--;) {
              a[aL] -= i;
              i = a[aL] < b[aL] ? 1 : 0;
              a[aL] = i * base + a[aL] - b[aL];
            }

            // Remove leading zeros.
            for (; !a[0] && a.length > 1; a.splice(0, 1));
          }

          // x: dividend, y: divisor.
          return function (x, y, dp, rm, base) {
            var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
              yL, yz,
              s = x.s == y.s ? 1 : -1,
              xc = x.c,
              yc = y.c;

            // Either NaN, Infinity or 0?
            if (!xc || !xc[0] || !yc || !yc[0]) {

              return new BigNumber(

               // Return NaN if either NaN, or both Infinity or 0.
               !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

                // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
                xc && xc[0] == 0 || !yc ? s * 0 : s / 0
             );
            }

            q = new BigNumber(s);
            qc = q.c = [];
            e = x.e - y.e;
            s = dp + e + 1;

            if (!base) {
              base = BASE;
              e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
              s = s / LOG_BASE | 0;
            }

            // Result exponent may be one less then the current value of e.
            // The coefficients of the BigNumbers from convertBase may have trailing zeros.
            for (i = 0; yc[i] == (xc[i] || 0); i++);

            if (yc[i] > (xc[i] || 0)) e--;

            if (s < 0) {
              qc.push(1);
              more = true;
            } else {
              xL = xc.length;
              yL = yc.length;
              i = 0;
              s += 2;

              // Normalise xc and yc so highest order digit of yc is >= base / 2.

              n = mathfloor(base / (yc[0] + 1));

              // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
              // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
              if (n > 1) {
                yc = multiply(yc, n, base);
                xc = multiply(xc, n, base);
                yL = yc.length;
                xL = xc.length;
              }

              xi = yL;
              rem = xc.slice(0, yL);
              remL = rem.length;

              // Add zeros to make remainder as long as divisor.
              for (; remL < yL; rem[remL++] = 0);
              yz = yc.slice();
              yz = [0].concat(yz);
              yc0 = yc[0];
              if (yc[1] >= base / 2) yc0++;
              // Not necessary, but to prevent trial digit n > base, when using base 3.
              // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

              do {
                n = 0;

                // Compare divisor and remainder.
                cmp = compare(yc, rem, yL, remL);

                // If divisor < remainder.
                if (cmp < 0) {

                  // Calculate trial digit, n.

                  rem0 = rem[0];
                  if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

                  // n is how many times the divisor goes into the current remainder.
                  n = mathfloor(rem0 / yc0);

                  //  Algorithm:
                  //  product = divisor multiplied by trial digit (n).
                  //  Compare product and remainder.
                  //  If product is greater than remainder:
                  //    Subtract divisor from product, decrement trial digit.
                  //  Subtract product from remainder.
                  //  If product was less than remainder at the last compare:
                  //    Compare new remainder and divisor.
                  //    If remainder is greater than divisor:
                  //      Subtract divisor from remainder, increment trial digit.

                  if (n > 1) {

                    // n may be > base only when base is 3.
                    if (n >= base) n = base - 1;

                    // product = divisor * trial digit.
                    prod = multiply(yc, n, base);
                    prodL = prod.length;
                    remL = rem.length;

                    // Compare product and remainder.
                    // If product > remainder then trial digit n too high.
                    // n is 1 too high about 5% of the time, and is not known to have
                    // ever been more than 1 too high.
                    while (compare(prod, rem, prodL, remL) == 1) {
                      n--;

                      // Subtract divisor from product.
                      subtract(prod, yL < prodL ? yz : yc, prodL, base);
                      prodL = prod.length;
                      cmp = 1;
                    }
                  } else {

                    // n is 0 or 1, cmp is -1.
                    // If n is 0, there is no need to compare yc and rem again below,
                    // so change cmp to 1 to avoid it.
                    // If n is 1, leave cmp as -1, so yc and rem are compared again.
                    if (n == 0) {

                      // divisor < remainder, so n must be at least 1.
                      cmp = n = 1;
                    }

                    // product = divisor
                    prod = yc.slice();
                    prodL = prod.length;
                  }

                  if (prodL < remL) prod = [0].concat(prod);

                  // Subtract product from remainder.
                  subtract(rem, prod, remL, base);
                  remL = rem.length;

                   // If product was < remainder.
                  if (cmp == -1) {

                    // Compare divisor and new remainder.
                    // If divisor < new remainder, subtract divisor from remainder.
                    // Trial digit n too low.
                    // n is 1 too low about 5% of the time, and very rarely 2 too low.
                    while (compare(yc, rem, yL, remL) < 1) {
                      n++;

                      // Subtract divisor from remainder.
                      subtract(rem, yL < remL ? yz : yc, remL, base);
                      remL = rem.length;
                    }
                  }
                } else if (cmp === 0) {
                  n++;
                  rem = [0];
                } // else cmp === 1 and n will be 0

                // Add the next digit, n, to the result array.
                qc[i++] = n;

                // Update the remainder.
                if (rem[0]) {
                  rem[remL++] = xc[xi] || 0;
                } else {
                  rem = [xc[xi]];
                  remL = 1;
                }
              } while ((xi++ < xL || rem[0] != null) && s--);

              more = rem[0] != null;

              // Leading zero?
              if (!qc[0]) qc.splice(0, 1);
            }

            if (base == BASE) {

              // To calculate q.e, first get the number of digits of qc[0].
              for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

              round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

            // Caller is convertBase.
            } else {
              q.e = e;
              q.r = +more;
            }

            return q;
          };
        })();


        /*
         * Return a string representing the value of BigNumber n in fixed-point or exponential
         * notation rounded to the specified decimal places or significant digits.
         *
         * n: a BigNumber.
         * i: the index of the last digit required (i.e. the digit that may be rounded up).
         * rm: the rounding mode.
         * id: 1 (toExponential) or 2 (toPrecision).
         */
        function format(n, i, rm, id) {
          var c0, e, ne, len, str;

          if (rm == null) rm = ROUNDING_MODE;
          else intCheck(rm, 0, 8);

          if (!n.c) return n.toString();

          c0 = n.c[0];
          ne = n.e;

          if (i == null) {
            str = coeffToString(n.c);
            str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
             ? toExponential(str, ne)
             : toFixedPoint(str, ne, '0');
          } else {
            n = round(new BigNumber(n), i, rm);

            // n.e may have changed if the value was rounded up.
            e = n.e;

            str = coeffToString(n.c);
            len = str.length;

            // toPrecision returns exponential notation if the number of significant digits
            // specified is less than the number of digits necessary to represent the integer
            // part of the value in fixed-point notation.

            // Exponential notation.
            if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

              // Append zeros?
              for (; len < i; str += '0', len++);
              str = toExponential(str, e);

            // Fixed-point notation.
            } else {
              i -= ne;
              str = toFixedPoint(str, e, '0');

              // Append zeros?
              if (e + 1 > len) {
                if (--i > 0) for (str += '.'; i--; str += '0');
              } else {
                i += e - len;
                if (i > 0) {
                  if (e + 1 == len) str += '.';
                  for (; i--; str += '0');
                }
              }
            }
          }

          return n.s < 0 && c0 ? '-' + str : str;
        }


        // Handle BigNumber.max and BigNumber.min.
        function maxOrMin(args, method) {
          var n,
            i = 1,
            m = new BigNumber(args[0]);

          for (; i < args.length; i++) {
            n = new BigNumber(args[i]);

            // If any number is NaN, return NaN.
            if (!n.s) {
              m = n;
              break;
            } else if (method.call(m, n)) {
              m = n;
            }
          }

          return m;
        }


        /*
         * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
         * Called by minus, plus and times.
         */
        function normalise(n, c, e) {
          var i = 1,
            j = c.length;

           // Remove trailing zeros.
          for (; !c[--j]; c.pop());

          // Calculate the base 10 exponent. First get the number of digits of c[0].
          for (j = c[0]; j >= 10; j /= 10, i++);

          // Overflow?
          if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

            // Infinity.
            n.c = n.e = null;

          // Underflow?
          } else if (e < MIN_EXP) {

            // Zero.
            n.c = [n.e = 0];
          } else {
            n.e = e;
            n.c = c;
          }

          return n;
        }


        // Handle values that fail the validity test in BigNumber.
        parseNumeric = (function () {
          var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
            dotAfter = /^([^.]+)\.$/,
            dotBefore = /^\.([^.]+)$/,
            isInfinityOrNaN = /^-?(Infinity|NaN)$/,
            whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

          return function (x, str, isNum, b) {
            var base,
              s = isNum ? str : str.replace(whitespaceOrPlus, '');

            // No exception on ±Infinity or NaN.
            if (isInfinityOrNaN.test(s)) {
              x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
            } else {
              if (!isNum) {

                // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
                s = s.replace(basePrefix, function (m, p1, p2) {
                  base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
                  return !b || b == base ? p1 : m;
                });

                if (b) {
                  base = b;

                  // E.g. '1.' to '1', '.1' to '0.1'
                  s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
                }

                if (str != s) return new BigNumber(s, base);
              }

              // '[BigNumber Error] Not a number: {n}'
              // '[BigNumber Error] Not a base {b} number: {n}'
              if (BigNumber.DEBUG) {
                throw Error
                  (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
              }

              // NaN
              x.s = null;
            }

            x.c = x.e = null;
          }
        })();


        /*
         * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
         * If r is truthy, it is known that there are more digits after the rounding digit.
         */
        function round(x, sd, rm, r) {
          var d, i, j, k, n, ni, rd,
            xc = x.c,
            pows10 = POWS_TEN;

          // if x is not Infinity or NaN...
          if (xc) {

            // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
            // n is a base 1e14 number, the value of the element of array x.c containing rd.
            // ni is the index of n within x.c.
            // d is the number of digits of n.
            // i is the index of rd within n including leading zeros.
            // j is the actual index of rd within n (if < 0, rd is a leading zero).
            out: {

              // Get the number of digits of the first element of xc.
              for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
              i = sd - d;

              // If the rounding digit is in the first element of xc...
              if (i < 0) {
                i += LOG_BASE;
                j = sd;
                n = xc[ni = 0];

                // Get the rounding digit at index j of n.
                rd = n / pows10[d - j - 1] % 10 | 0;
              } else {
                ni = mathceil((i + 1) / LOG_BASE);

                if (ni >= xc.length) {

                  if (r) {

                    // Needed by sqrt.
                    for (; xc.length <= ni; xc.push(0));
                    n = rd = 0;
                    d = 1;
                    i %= LOG_BASE;
                    j = i - LOG_BASE + 1;
                  } else {
                    break out;
                  }
                } else {
                  n = k = xc[ni];

                  // Get the number of digits of n.
                  for (d = 1; k >= 10; k /= 10, d++);

                  // Get the index of rd within n.
                  i %= LOG_BASE;

                  // Get the index of rd within n, adjusted for leading zeros.
                  // The number of leading zeros of n is given by LOG_BASE - d.
                  j = i - LOG_BASE + d;

                  // Get the rounding digit at index j of n.
                  rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
                }
              }

              r = r || sd < 0 ||

              // Are there any non-zero digits after the rounding digit?
              // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
              // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
               xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

              r = rm < 4
               ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
               : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

                // Check whether the digit to the left of the rounding digit is odd.
                ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
                 rm == (x.s < 0 ? 8 : 7));

              if (sd < 1 || !xc[0]) {
                xc.length = 0;

                if (r) {

                  // Convert sd to decimal places.
                  sd -= x.e + 1;

                  // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                  xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
                  x.e = -sd || 0;
                } else {

                  // Zero.
                  xc[0] = x.e = 0;
                }

                return x;
              }

              // Remove excess digits.
              if (i == 0) {
                xc.length = ni;
                k = 1;
                ni--;
              } else {
                xc.length = ni + 1;
                k = pows10[LOG_BASE - i];

                // E.g. 56700 becomes 56000 if 7 is the rounding digit.
                // j > 0 means i > number of leading zeros of n.
                xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
              }

              // Round up?
              if (r) {

                for (; ;) {

                  // If the digit to be rounded up is in the first element of xc...
                  if (ni == 0) {

                    // i will be the length of xc[0] before k is added.
                    for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                    j = xc[0] += k;
                    for (k = 1; j >= 10; j /= 10, k++);

                    // if i != k the length has increased.
                    if (i != k) {
                      x.e++;
                      if (xc[0] == BASE) xc[0] = 1;
                    }

                    break;
                  } else {
                    xc[ni] += k;
                    if (xc[ni] != BASE) break;
                    xc[ni--] = 0;
                    k = 1;
                  }
                }
              }

              // Remove trailing zeros.
              for (i = xc.length; xc[--i] === 0; xc.pop());
            }

            // Overflow? Infinity.
            if (x.e > MAX_EXP) {
              x.c = x.e = null;

            // Underflow? Zero.
            } else if (x.e < MIN_EXP) {
              x.c = [x.e = 0];
            }
          }

          return x;
        }


        function valueOf(n) {
          var str,
            e = n.e;

          if (e === null) return n.toString();

          str = coeffToString(n.c);

          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
            ? toExponential(str, e)
            : toFixedPoint(str, e, '0');

          return n.s < 0 ? '-' + str : str;
        }


        // PROTOTYPE/INSTANCE METHODS


        /*
         * Return a new BigNumber whose value is the absolute value of this BigNumber.
         */
        P.absoluteValue = P.abs = function () {
          var x = new BigNumber(this);
          if (x.s < 0) x.s = 1;
          return x;
        };


        /*
         * Return
         *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
         *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
         *   0 if they have the same value,
         *   or null if the value of either is NaN.
         */
        P.comparedTo = function (y, b) {
          return compare(this, new BigNumber(y, b));
        };


        /*
         * If dp is undefined or null or true or false, return the number of decimal places of the
         * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
         *
         * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
         * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
         * ROUNDING_MODE if rm is omitted.
         *
         * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
         */
        P.decimalPlaces = P.dp = function (dp, rm) {
          var c, n, v,
            x = this;

          if (dp != null) {
            intCheck(dp, 0, MAX);
            if (rm == null) rm = ROUNDING_MODE;
            else intCheck(rm, 0, 8);

            return round(new BigNumber(x), dp + x.e + 1, rm);
          }

          if (!(c = x.c)) return null;
          n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

          // Subtract the number of trailing zeros of the last number.
          if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
          if (n < 0) n = 0;

          return n;
        };


        /*
         *  n / 0 = I
         *  n / N = N
         *  n / I = 0
         *  0 / n = 0
         *  0 / 0 = N
         *  0 / N = N
         *  0 / I = 0
         *  N / n = N
         *  N / 0 = N
         *  N / N = N
         *  N / I = N
         *  I / n = I
         *  I / 0 = I
         *  I / N = N
         *  I / I = N
         *
         * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
         * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
         */
        P.dividedBy = P.div = function (y, b) {
          return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
        };


        /*
         * Return a new BigNumber whose value is the integer part of dividing the value of this
         * BigNumber by the value of BigNumber(y, b).
         */
        P.dividedToIntegerBy = P.idiv = function (y, b) {
          return div(this, new BigNumber(y, b), 0, 1);
        };


        /*
         * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
         *
         * If m is present, return the result modulo m.
         * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
         * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
         *
         * The modular power operation works efficiently when x, n, and m are integers, otherwise it
         * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
         *
         * n {number|string|BigNumber} The exponent. An integer.
         * [m] {number|string|BigNumber} The modulus.
         *
         * '[BigNumber Error] Exponent not an integer: {n}'
         */
        P.exponentiatedBy = P.pow = function (n, m) {
          var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
            x = this;

          n = new BigNumber(n);

          // Allow NaN and ±Infinity, but not other non-integers.
          if (n.c && !n.isInteger()) {
            throw Error
              (bignumberError + 'Exponent not an integer: ' + valueOf(n));
          }

          if (m != null) m = new BigNumber(m);

          // Exponent of MAX_SAFE_INTEGER is 15.
          nIsBig = n.e > 14;

          // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
          if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

            // The sign of the result of pow when x is negative depends on the evenness of n.
            // If +n overflows to ±Infinity, the evenness of n would be not be known.
            y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
            return m ? y.mod(m) : y;
          }

          nIsNeg = n.s < 0;

          if (m) {

            // x % m returns NaN if abs(m) is zero, or m is NaN.
            if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

            isModExp = !nIsNeg && x.isInteger() && m.isInteger();

            if (isModExp) x = x.mod(m);

          // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
          // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
          } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
            // [1, 240000000]
            ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
            // [80000000000000]  [99999750000000]
            : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

            // If x is negative and n is odd, k = -0, else k = 0.
            k = x.s < 0 && isOdd(n) ? -0 : 0;

            // If x >= 1, k = ±Infinity.
            if (x.e > -1) k = 1 / k;

            // If n is negative return ±0, else return ±Infinity.
            return new BigNumber(nIsNeg ? 1 / k : k);

          } else if (POW_PRECISION) {

            // Truncating each coefficient array to a length of k after each multiplication
            // equates to truncating significant digits to POW_PRECISION + [28, 41],
            // i.e. there will be a minimum of 28 guard digits retained.
            k = mathceil(POW_PRECISION / LOG_BASE + 2);
          }

          if (nIsBig) {
            half = new BigNumber(0.5);
            if (nIsNeg) n.s = 1;
            nIsOdd = isOdd(n);
          } else {
            i = Math.abs(+valueOf(n));
            nIsOdd = i % 2;
          }

          y = new BigNumber(ONE);

          // Performs 54 loop iterations for n of 9007199254740991.
          for (; ;) {

            if (nIsOdd) {
              y = y.times(x);
              if (!y.c) break;

              if (k) {
                if (y.c.length > k) y.c.length = k;
              } else if (isModExp) {
                y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
              }
            }

            if (i) {
              i = mathfloor(i / 2);
              if (i === 0) break;
              nIsOdd = i % 2;
            } else {
              n = n.times(half);
              round(n, n.e + 1, 1);

              if (n.e > 14) {
                nIsOdd = isOdd(n);
              } else {
                i = +valueOf(n);
                if (i === 0) break;
                nIsOdd = i % 2;
              }
            }

            x = x.times(x);

            if (k) {
              if (x.c && x.c.length > k) x.c.length = k;
            } else if (isModExp) {
              x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
            }
          }

          if (isModExp) return y;
          if (nIsNeg) y = ONE.div(y);

          return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
         * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
         *
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
         */
        P.integerValue = function (rm) {
          var n = new BigNumber(this);
          if (rm == null) rm = ROUNDING_MODE;
          else intCheck(rm, 0, 8);
          return round(n, n.e + 1, rm);
        };


        /*
         * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
         * otherwise return false.
         */
        P.isEqualTo = P.eq = function (y, b) {
          return compare(this, new BigNumber(y, b)) === 0;
        };


        /*
         * Return true if the value of this BigNumber is a finite number, otherwise return false.
         */
        P.isFinite = function () {
          return !!this.c;
        };


        /*
         * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
         * otherwise return false.
         */
        P.isGreaterThan = P.gt = function (y, b) {
          return compare(this, new BigNumber(y, b)) > 0;
        };


        /*
         * Return true if the value of this BigNumber is greater than or equal to the value of
         * BigNumber(y, b), otherwise return false.
         */
        P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
          return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

        };


        /*
         * Return true if the value of this BigNumber is an integer, otherwise return false.
         */
        P.isInteger = function () {
          return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
        };


        /*
         * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
         * otherwise return false.
         */
        P.isLessThan = P.lt = function (y, b) {
          return compare(this, new BigNumber(y, b)) < 0;
        };


        /*
         * Return true if the value of this BigNumber is less than or equal to the value of
         * BigNumber(y, b), otherwise return false.
         */
        P.isLessThanOrEqualTo = P.lte = function (y, b) {
          return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
        };


        /*
         * Return true if the value of this BigNumber is NaN, otherwise return false.
         */
        P.isNaN = function () {
          return !this.s;
        };


        /*
         * Return true if the value of this BigNumber is negative, otherwise return false.
         */
        P.isNegative = function () {
          return this.s < 0;
        };


        /*
         * Return true if the value of this BigNumber is positive, otherwise return false.
         */
        P.isPositive = function () {
          return this.s > 0;
        };


        /*
         * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
         */
        P.isZero = function () {
          return !!this.c && this.c[0] == 0;
        };


        /*
         *  n - 0 = n
         *  n - N = N
         *  n - I = -I
         *  0 - n = -n
         *  0 - 0 = 0
         *  0 - N = N
         *  0 - I = -I
         *  N - n = N
         *  N - 0 = N
         *  N - N = N
         *  N - I = N
         *  I - n = I
         *  I - 0 = I
         *  I - N = N
         *  I - I = N
         *
         * Return a new BigNumber whose value is the value of this BigNumber minus the value of
         * BigNumber(y, b).
         */
        P.minus = function (y, b) {
          var i, j, t, xLTy,
            x = this,
            a = x.s;

          y = new BigNumber(y, b);
          b = y.s;

          // Either NaN?
          if (!a || !b) return new BigNumber(NaN);

          // Signs differ?
          if (a != b) {
            y.s = -b;
            return x.plus(y);
          }

          var xe = x.e / LOG_BASE,
            ye = y.e / LOG_BASE,
            xc = x.c,
            yc = y.c;

          if (!xe || !ye) {

            // Either Infinity?
            if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

            // Either zero?
            if (!xc[0] || !yc[0]) {

              // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
              return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

               // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
               ROUNDING_MODE == 3 ? -0 : 0);
            }
          }

          xe = bitFloor(xe);
          ye = bitFloor(ye);
          xc = xc.slice();

          // Determine which is the bigger number.
          if (a = xe - ye) {

            if (xLTy = a < 0) {
              a = -a;
              t = xc;
            } else {
              ye = xe;
              t = yc;
            }

            t.reverse();

            // Prepend zeros to equalise exponents.
            for (b = a; b--; t.push(0));
            t.reverse();
          } else {

            // Exponents equal. Check digit by digit.
            j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

            for (a = b = 0; b < j; b++) {

              if (xc[b] != yc[b]) {
                xLTy = xc[b] < yc[b];
                break;
              }
            }
          }

          // x < y? Point xc to the array of the bigger number.
          if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

          b = (j = yc.length) - (i = xc.length);

          // Append zeros to xc if shorter.
          // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
          if (b > 0) for (; b--; xc[i++] = 0);
          b = BASE - 1;

          // Subtract yc from xc.
          for (; j > a;) {

            if (xc[--j] < yc[j]) {
              for (i = j; i && !xc[--i]; xc[i] = b);
              --xc[i];
              xc[j] += BASE;
            }

            xc[j] -= yc[j];
          }

          // Remove leading zeros and adjust exponent accordingly.
          for (; xc[0] == 0; xc.splice(0, 1), --ye);

          // Zero?
          if (!xc[0]) {

            // Following IEEE 754 (2008) 6.3,
            // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
            y.s = ROUNDING_MODE == 3 ? -1 : 1;
            y.c = [y.e = 0];
            return y;
          }

          // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
          // for finite x and y.
          return normalise(y, xc, ye);
        };


        /*
         *   n % 0 =  N
         *   n % N =  N
         *   n % I =  n
         *   0 % n =  0
         *  -0 % n = -0
         *   0 % 0 =  N
         *   0 % N =  N
         *   0 % I =  0
         *   N % n =  N
         *   N % 0 =  N
         *   N % N =  N
         *   N % I =  N
         *   I % n =  N
         *   I % 0 =  N
         *   I % N =  N
         *   I % I =  N
         *
         * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
         * BigNumber(y, b). The result depends on the value of MODULO_MODE.
         */
        P.modulo = P.mod = function (y, b) {
          var q, s,
            x = this;

          y = new BigNumber(y, b);

          // Return NaN if x is Infinity or NaN, or y is NaN or zero.
          if (!x.c || !y.s || y.c && !y.c[0]) {
            return new BigNumber(NaN);

          // Return x if y is Infinity or x is zero.
          } else if (!y.c || x.c && !x.c[0]) {
            return new BigNumber(x);
          }

          if (MODULO_MODE == 9) {

            // Euclidian division: q = sign(y) * floor(x / abs(y))
            // r = x - qy    where  0 <= r < abs(y)
            s = y.s;
            y.s = 1;
            q = div(x, y, 0, 3);
            y.s = s;
            q.s *= s;
          } else {
            q = div(x, y, 0, MODULO_MODE);
          }

          y = x.minus(q.times(y));

          // To match JavaScript %, ensure sign of zero is sign of dividend.
          if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

          return y;
        };


        /*
         *  n * 0 = 0
         *  n * N = N
         *  n * I = I
         *  0 * n = 0
         *  0 * 0 = 0
         *  0 * N = N
         *  0 * I = N
         *  N * n = N
         *  N * 0 = N
         *  N * N = N
         *  N * I = N
         *  I * n = I
         *  I * 0 = N
         *  I * N = N
         *  I * I = I
         *
         * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
         * of BigNumber(y, b).
         */
        P.multipliedBy = P.times = function (y, b) {
          var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
            base, sqrtBase,
            x = this,
            xc = x.c,
            yc = (y = new BigNumber(y, b)).c;

          // Either NaN, ±Infinity or ±0?
          if (!xc || !yc || !xc[0] || !yc[0]) {

            // Return NaN if either is NaN, or one is 0 and the other is Infinity.
            if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
              y.c = y.e = y.s = null;
            } else {
              y.s *= x.s;

              // Return ±Infinity if either is ±Infinity.
              if (!xc || !yc) {
                y.c = y.e = null;

              // Return ±0 if either is ±0.
              } else {
                y.c = [0];
                y.e = 0;
              }
            }

            return y;
          }

          e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
          y.s *= x.s;
          xcL = xc.length;
          ycL = yc.length;

          // Ensure xc points to longer array and xcL to its length.
          if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

          // Initialise the result array with zeros.
          for (i = xcL + ycL, zc = []; i--; zc.push(0));

          base = BASE;
          sqrtBase = SQRT_BASE;

          for (i = ycL; --i >= 0;) {
            c = 0;
            ylo = yc[i] % sqrtBase;
            yhi = yc[i] / sqrtBase | 0;

            for (k = xcL, j = i + k; j > i;) {
              xlo = xc[--k] % sqrtBase;
              xhi = xc[k] / sqrtBase | 0;
              m = yhi * xlo + xhi * ylo;
              xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
              c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
              zc[j--] = xlo % base;
            }

            zc[j] = c;
          }

          if (c) {
            ++e;
          } else {
            zc.splice(0, 1);
          }

          return normalise(y, zc, e);
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber negated,
         * i.e. multiplied by -1.
         */
        P.negated = function () {
          var x = new BigNumber(this);
          x.s = -x.s || null;
          return x;
        };


        /*
         *  n + 0 = n
         *  n + N = N
         *  n + I = I
         *  0 + n = n
         *  0 + 0 = 0
         *  0 + N = N
         *  0 + I = I
         *  N + n = N
         *  N + 0 = N
         *  N + N = N
         *  N + I = N
         *  I + n = I
         *  I + 0 = I
         *  I + N = N
         *  I + I = I
         *
         * Return a new BigNumber whose value is the value of this BigNumber plus the value of
         * BigNumber(y, b).
         */
        P.plus = function (y, b) {
          var t,
            x = this,
            a = x.s;

          y = new BigNumber(y, b);
          b = y.s;

          // Either NaN?
          if (!a || !b) return new BigNumber(NaN);

          // Signs differ?
           if (a != b) {
            y.s = -b;
            return x.minus(y);
          }

          var xe = x.e / LOG_BASE,
            ye = y.e / LOG_BASE,
            xc = x.c,
            yc = y.c;

          if (!xe || !ye) {

            // Return ±Infinity if either ±Infinity.
            if (!xc || !yc) return new BigNumber(a / 0);

            // Either zero?
            // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
            if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
          }

          xe = bitFloor(xe);
          ye = bitFloor(ye);
          xc = xc.slice();

          // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
          if (a = xe - ye) {
            if (a > 0) {
              ye = xe;
              t = yc;
            } else {
              a = -a;
              t = xc;
            }

            t.reverse();
            for (; a--; t.push(0));
            t.reverse();
          }

          a = xc.length;
          b = yc.length;

          // Point xc to the longer array, and b to the shorter length.
          if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

          // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
          for (a = 0; b;) {
            a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
            xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
          }

          if (a) {
            xc = [a].concat(xc);
            ++ye;
          }

          // No need to check for zero, as +x + +y != 0 && -x + -y != 0
          // ye = MAX_EXP + 1 possible
          return normalise(y, xc, ye);
        };


        /*
         * If sd is undefined or null or true or false, return the number of significant digits of
         * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
         * If sd is true include integer-part trailing zeros in the count.
         *
         * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
         * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
         * ROUNDING_MODE if rm is omitted.
         *
         * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
         *                     boolean: whether to count integer-part trailing zeros: true or false.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
         */
        P.precision = P.sd = function (sd, rm) {
          var c, n, v,
            x = this;

          if (sd != null && sd !== !!sd) {
            intCheck(sd, 1, MAX);
            if (rm == null) rm = ROUNDING_MODE;
            else intCheck(rm, 0, 8);

            return round(new BigNumber(x), sd, rm);
          }

          if (!(c = x.c)) return null;
          v = c.length - 1;
          n = v * LOG_BASE + 1;

          if (v = c[v]) {

            // Subtract the number of trailing zeros of the last element.
            for (; v % 10 == 0; v /= 10, n--);

            // Add the number of digits of the first element.
            for (v = c[0]; v >= 10; v /= 10, n++);
          }

          if (sd && x.e + 1 > n) n = x.e + 1;

          return n;
        };


        /*
         * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
         * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
         *
         * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
         */
        P.shiftedBy = function (k) {
          intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
          return this.times('1e' + k);
        };


        /*
         *  sqrt(-n) =  N
         *  sqrt(N) =  N
         *  sqrt(-I) =  N
         *  sqrt(I) =  I
         *  sqrt(0) =  0
         *  sqrt(-0) = -0
         *
         * Return a new BigNumber whose value is the square root of the value of this BigNumber,
         * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
         */
        P.squareRoot = P.sqrt = function () {
          var m, n, r, rep, t,
            x = this,
            c = x.c,
            s = x.s,
            e = x.e,
            dp = DECIMAL_PLACES + 4,
            half = new BigNumber('0.5');

          // Negative/NaN/Infinity/zero?
          if (s !== 1 || !c || !c[0]) {
            return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
          }

          // Initial estimate.
          s = Math.sqrt(+valueOf(x));

          // Math.sqrt underflow/overflow?
          // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
          if (s == 0 || s == 1 / 0) {
            n = coeffToString(c);
            if ((n.length + e) % 2 == 0) n += '0';
            s = Math.sqrt(+n);
            e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

            if (s == 1 / 0) {
              n = '5e' + e;
            } else {
              n = s.toExponential();
              n = n.slice(0, n.indexOf('e') + 1) + e;
            }

            r = new BigNumber(n);
          } else {
            r = new BigNumber(s + '');
          }

          // Check for zero.
          // r could be zero if MIN_EXP is changed after the this value was created.
          // This would cause a division by zero (x/t) and hence Infinity below, which would cause
          // coeffToString to throw.
          if (r.c[0]) {
            e = r.e;
            s = e + dp;
            if (s < 3) s = 0;

            // Newton-Raphson iteration.
            for (; ;) {
              t = r;
              r = half.times(t.plus(div(x, t, dp, 1)));

              if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

                // The exponent of r may here be one less than the final result exponent,
                // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
                // are indexed correctly.
                if (r.e < e) --s;
                n = n.slice(s - 3, s + 1);

                // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
                // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
                // iteration.
                if (n == '9999' || !rep && n == '4999') {

                  // On the first iteration only, check to see if rounding up gives the
                  // exact result as the nines may infinitely repeat.
                  if (!rep) {
                    round(t, t.e + DECIMAL_PLACES + 2, 0);

                    if (t.times(t).eq(x)) {
                      r = t;
                      break;
                    }
                  }

                  dp += 4;
                  s += 4;
                  rep = 1;
                } else {

                  // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
                  // result. If not, then there are further digits and m will be truthy.
                  if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                    // Truncate to the first rounding digit.
                    round(r, r.e + DECIMAL_PLACES + 2, 1);
                    m = !r.times(r).eq(x);
                  }

                  break;
                }
              }
            }
          }

          return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
        };


        /*
         * Return a string representing the value of this BigNumber in exponential notation and
         * rounded using ROUNDING_MODE to dp fixed decimal places.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
         */
        P.toExponential = function (dp, rm) {
          if (dp != null) {
            intCheck(dp, 0, MAX);
            dp++;
          }
          return format(this, dp, rm, 1);
        };


        /*
         * Return a string representing the value of this BigNumber in fixed-point notation rounding
         * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
         *
         * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
         * but e.g. (-0.00001).toFixed(0) is '-0'.
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
         */
        P.toFixed = function (dp, rm) {
          if (dp != null) {
            intCheck(dp, 0, MAX);
            dp = dp + this.e + 1;
          }
          return format(this, dp, rm);
        };


        /*
         * Return a string representing the value of this BigNumber in fixed-point notation rounded
         * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
         * of the format or FORMAT object (see BigNumber.set).
         *
         * The formatting object may contain some or all of the properties shown below.
         *
         * FORMAT = {
         *   prefix: '',
         *   groupSize: 3,
         *   secondaryGroupSize: 0,
         *   groupSeparator: ',',
         *   decimalSeparator: '.',
         *   fractionGroupSize: 0,
         *   fractionGroupSeparator: '\xA0',      // non-breaking space
         *   suffix: ''
         * };
         *
         * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         * [format] {object} Formatting options. See FORMAT pbject above.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
         * '[BigNumber Error] Argument not an object: {format}'
         */
        P.toFormat = function (dp, rm, format) {
          var str,
            x = this;

          if (format == null) {
            if (dp != null && rm && typeof rm == 'object') {
              format = rm;
              rm = null;
            } else if (dp && typeof dp == 'object') {
              format = dp;
              dp = rm = null;
            } else {
              format = FORMAT;
            }
          } else if (typeof format != 'object') {
            throw Error
              (bignumberError + 'Argument not an object: ' + format);
          }

          str = x.toFixed(dp, rm);

          if (x.c) {
            var i,
              arr = str.split('.'),
              g1 = +format.groupSize,
              g2 = +format.secondaryGroupSize,
              groupSeparator = format.groupSeparator || '',
              intPart = arr[0],
              fractionPart = arr[1],
              isNeg = x.s < 0,
              intDigits = isNeg ? intPart.slice(1) : intPart,
              len = intDigits.length;

            if (g2) i = g1, g1 = g2, g2 = i, len -= i;

            if (g1 > 0 && len > 0) {
              i = len % g1 || g1;
              intPart = intDigits.substr(0, i);
              for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
              if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
              if (isNeg) intPart = '-' + intPart;
            }

            str = fractionPart
             ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
              ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
               '$&' + (format.fractionGroupSeparator || ''))
              : fractionPart)
             : intPart;
          }

          return (format.prefix || '') + str + (format.suffix || '');
        };


        /*
         * Return an array of two BigNumbers representing the value of this BigNumber as a simple
         * fraction with an integer numerator and an integer denominator.
         * The denominator will be a positive non-zero value less than or equal to the specified
         * maximum denominator. If a maximum denominator is not specified, the denominator will be
         * the lowest value necessary to represent the number exactly.
         *
         * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
         *
         * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
         */
        P.toFraction = function (md) {
          var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
            x = this,
            xc = x.c;

          if (md != null) {
            n = new BigNumber(md);

            // Throw if md is less than one or is not an integer, unless it is Infinity.
            if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
              throw Error
                (bignumberError + 'Argument ' +
                  (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
            }
          }

          if (!xc) return new BigNumber(x);

          d = new BigNumber(ONE);
          n1 = d0 = new BigNumber(ONE);
          d1 = n0 = new BigNumber(ONE);
          s = coeffToString(xc);

          // Determine initial denominator.
          // d is a power of 10 and the minimum max denominator that specifies the value exactly.
          e = d.e = s.length - x.e - 1;
          d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
          md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

          exp = MAX_EXP;
          MAX_EXP = 1 / 0;
          n = new BigNumber(s);

          // n0 = d1 = 0
          n0.c[0] = 0;

          for (; ;)  {
            q = div(n, d, 0, 1);
            d2 = d0.plus(q.times(d1));
            if (d2.comparedTo(md) == 1) break;
            d0 = d1;
            d1 = d2;
            n1 = n0.plus(q.times(d2 = n1));
            n0 = d2;
            d = n.minus(q.times(d2 = d));
            n = d2;
          }

          d2 = div(md.minus(d0), d1, 0, 1);
          n0 = n0.plus(d2.times(n1));
          d0 = d0.plus(d2.times(d1));
          n0.s = n1.s = x.s;
          e = e * 2;

          // Determine which fraction is closer to x, n0/d0 or n1/d1
          r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
              div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

          MAX_EXP = exp;

          return r;
        };


        /*
         * Return the value of this BigNumber converted to a number primitive.
         */
        P.toNumber = function () {
          return +valueOf(this);
        };


        /*
         * Return a string representing the value of this BigNumber rounded to sd significant digits
         * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
         * necessary to represent the integer part of the value in fixed-point notation, then use
         * exponential notation.
         *
         * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
         * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
         *
         * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
         */
        P.toPrecision = function (sd, rm) {
          if (sd != null) intCheck(sd, 1, MAX);
          return format(this, sd, rm, 2);
        };


        /*
         * Return a string representing the value of this BigNumber in base b, or base 10 if b is
         * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
         * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
         * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
         * TO_EXP_NEG, return exponential notation.
         *
         * [b] {number} Integer, 2 to ALPHABET.length inclusive.
         *
         * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
         */
        P.toString = function (b) {
          var str,
            n = this,
            s = n.s,
            e = n.e;

          // Infinity or NaN?
          if (e === null) {
            if (s) {
              str = 'Infinity';
              if (s < 0) str = '-' + str;
            } else {
              str = 'NaN';
            }
          } else {
            if (b == null) {
              str = e <= TO_EXP_NEG || e >= TO_EXP_POS
               ? toExponential(coeffToString(n.c), e)
               : toFixedPoint(coeffToString(n.c), e, '0');
            } else if (b === 10 && alphabetHasNormalDecimalDigits) {
              n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
              str = toFixedPoint(coeffToString(n.c), n.e, '0');
            } else {
              intCheck(b, 2, ALPHABET.length, 'Base');
              str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
            }

            if (s < 0 && n.c[0]) str = '-' + str;
          }

          return str;
        };


        /*
         * Return as toString, but do not accept a base argument, and include the minus sign for
         * negative zero.
         */
        P.valueOf = P.toJSON = function () {
          return valueOf(this);
        };


        P._isBigNumber = true;

        if (configObject != null) BigNumber.set(configObject);

        return BigNumber;
      }


      // PRIVATE HELPER FUNCTIONS

      // These functions don't need access to variables,
      // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


      function bitFloor(n) {
        var i = n | 0;
        return n > 0 || n === i ? i : i - 1;
      }


      // Return a coefficient array as a string of base 10 digits.
      function coeffToString(a) {
        var s, z,
          i = 1,
          j = a.length,
          r = a[0] + '';

        for (; i < j;) {
          s = a[i++] + '';
          z = LOG_BASE - s.length;
          for (; z--; s = '0' + s);
          r += s;
        }

        // Determine trailing zeros.
        for (j = r.length; r.charCodeAt(--j) === 48;);

        return r.slice(0, j + 1 || 1);
      }


      // Compare the value of BigNumbers x and y.
      function compare(x, y) {
        var a, b,
          xc = x.c,
          yc = y.c,
          i = x.s,
          j = y.s,
          k = x.e,
          l = y.e;

        // Either NaN?
        if (!i || !j) return null;

        a = xc && !xc[0];
        b = yc && !yc[0];

        // Either zero?
        if (a || b) return a ? b ? 0 : -j : i;

        // Signs differ?
        if (i != j) return i;

        a = i < 0;
        b = k == l;

        // Either Infinity?
        if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

        // Compare exponents.
        if (!b) return k > l ^ a ? 1 : -1;

        j = (k = xc.length) < (l = yc.length) ? k : l;

        // Compare digit by digit.
        for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

        // Compare lengths.
        return k == l ? 0 : k > l ^ a ? 1 : -1;
      }


      /*
       * Check that n is a primitive number, an integer, and in range, otherwise throw.
       */
      function intCheck(n, min, max, name) {
        if (n < min || n > max || n !== mathfloor(n)) {
          throw Error
           (bignumberError + (name || 'Argument') + (typeof n == 'number'
             ? n < min || n > max ? ' out of range: ' : ' not an integer: '
             : ' not a primitive number: ') + String(n));
        }
      }


      // Assumes finite n.
      function isOdd(n) {
        var k = n.c.length - 1;
        return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
      }


      function toExponential(str, e) {
        return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
         (e < 0 ? 'e' : 'e+') + e;
      }


      function toFixedPoint(str, e, z) {
        var len, zs;

        // Negative exponent?
        if (e < 0) {

          // Prepend zeros.
          for (zs = z + '.'; ++e; zs += z);
          str = zs + str;

        // Positive exponent
        } else {
          len = str.length;

          // Append zeros.
          if (++e > len) {
            for (zs = z, e -= len; --e; zs += z);
            str += zs;
          } else if (e < len) {
            str = str.slice(0, e) + '.' + str.slice(e);
          }
        }

        return str;
      }


      // EXPORT


      BigNumber = clone();
      BigNumber['default'] = BigNumber.BigNumber = BigNumber;

      // AMD.
      if (module.exports) {
        module.exports = BigNumber;

      // Browser.
      } else {
        if (!globalObject) {
          globalObject = typeof self != 'undefined' && self ? self : window;
        }

        globalObject.BigNumber = BigNumber;
      }
    })(commonjsGlobal);
    });

    function setCharAt(str, index, chr) {
        if(index > str.length - 1)
            return str;

        return str.substring(0, index) + chr + str.substring(index + 1);
    }

    function kValueBinaryToBase(value, base) {
        let valueBigNumber;
        let valueBigNumberString;
        bignumber.BigNumber.config({ ALPHABET: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~' });
       
        if (base === 'b64') {
            valueBigNumber = new bignumber.BigNumber(value, 2).times(17);
            valueBigNumberString = valueBigNumber.toString(64);
        } else if (base === 'dec') {
            valueBigNumber = new bignumber.BigNumber(value, 2).times(17);
            valueBigNumberString = valueBigNumber.toString(10);
        } else if (base === 'bin') {
            valueBigNumberString = value;
        } else { /* shouldn't be possible */
            valueBigNumberString = '!ERROR!'; 
        }

        return valueBigNumberString;
    }
    function kValueBaseToBinary(value, base) {
        let valueBinaryString;
        bignumber.BigNumber.config({ ALPHABET: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~' });
        
        if (base === 'b64') {
            valueBinaryString = new bignumber.BigNumber(value, 64).div(17).toString(2).padStart(1802, 0);
        } else if (base === 'dec') {
            valueBinaryString = new bignumber.BigNumber(value, 10).div(17).toString(2).padStart(1802, 0);
        } else if (base === 'bin') {
            valueBinaryString = value;
        } else { /* shouldn't be possible */
            valueBinaryString = '!ERROR!'; 
        }

        return valueBinaryString;
    }
    function findTouchIndexById(arrayToSearh, idToFind) {
        for (let i = 0; i < arrayToSearh.length; i++) {
            const id = arrayToSearh[i].pointerId;
            if (id == idToFind) {
                return i;
            }
        }
        /* not found */
        return -1;
    }

    function copyCanvasTouch({ pointerId, layerX, layerY }) {
        return { pointerId, layerX, layerY };
    }

    function getPixelsOnTheLine(x1, y1, x2, y2, pixelSize) {
        // Array to be returned in the end
        const pixelArray = [];
        let arrayLast = 0;
        // PseudoPixel coordinates
        let pixelCoordinates;
        let pixelX = 20;
        let pixelY = 20;
        // Iterators, counters required by algorithm
        let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;
        // Calculate line deltas
        dx = x2 - x1;
        dy = y2 - y1;
        // Create a positive copy of deltas (makes iterating easier)
        dx1 = Math.abs(dx);
        dy1 = Math.abs(dy);
        // Calculate error intervals for both axis
        px = 2 * dy1 - dx1;
        py = 2 * dx1 - dy1;
        // The line is X-axis dominant
        if (dy1 <= dx1) {
            // Line is drawn left to right
            if (dx >= 0) {
                x = x1; y = y1; xe = x2;
            } else { 
                // Line is drawn right to left (swap ends)
                x = x2; y = y2; xe = x1;
            }
            // Rasterize the line
            for (i = 0; x < xe; i++) {
                x = x + 1;
                // Deal with octants...
                if (px < 0) {
                    px = px + 2 * dy1;
                } else {
                    if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                        y = y + 1;
                    } else {
                        y = y - 1;
                    }
                    px = px + 2 * (dy1 - dx1);
                }
                // Draw pixel from line span at
                // currently rasterized position
                pixelX = Math.floor(x / pixelSize);
                pixelY = Math.floor(y / pixelSize);
                pixelCoordinates = [pixelX, pixelY];
                arrayLast = pixelArray.length - 1;
                if (pixelArray.length > 0) {
                    if (pixelX != pixelArray[arrayLast][0] || pixelY != pixelArray[arrayLast][1])
                        pixelArray.push(pixelCoordinates);
                } else {
                    pixelArray.push(pixelCoordinates);
                }
            }
        } else {
            // The line is Y-axis dominant
            // Line is drawn bottom to top
            if (dy >= 0) {
                x = x1; y = y1; ye = y2;
            } else {
                // Line is drawn top to bottom
                x = x2; y = y2; ye = y1;
            }
             // Rasterize the line
            for (i = 0; y < ye; i++) {
                y = y + 1;
                // Deal with octants...
                if (py <= 0) {
                    py = py + 2 * dx1;
                } else {
                    if ((dx < 0 && dy<0) || (dx > 0 && dy > 0)) {
                        x = x + 1;
                    } else {
                        x = x - 1;
                    }
                    py = py + 2 * (dx1 - dy1);
                }
                // Draw pixel from line span at
                // currently rasterized position
                pixelX = Math.floor(x / pixelSize);
                pixelY = Math.floor(y / pixelSize);
                pixelCoordinates = [pixelX, pixelY];
                arrayLast = pixelArray.length - 1;
                if (pixelArray.length > 0) {
                    if (pixelX != pixelArray[arrayLast][0] || pixelY != pixelArray[arrayLast][1])
                        pixelArray.push(pixelCoordinates);
                } else {
                    pixelArray.push(pixelCoordinates);
                }
            }
        }
        return pixelArray;
    }

    /* src/Canvas.svelte generated by Svelte v3.48.0 */

    const file = "src/Canvas.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (248:20) {#each Array(27) as _, indexPix (indexPix)}
    function create_each_block_7(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pixel frame-pixel svelte-4gs6t4");
    			add_location(div, file, 248, 24, 9050);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(248:20) {#each Array(27) as _, indexPix (indexPix)}",
    		ctx
    	});

    	return block;
    }

    // (246:12) {#each Array(5) as _, indexCol (indexCol)}
    function create_each_block_6(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value_7 = Array(27);
    	validate_each_argument(each_value_7);
    	const get_key = ctx => /*indexPix*/ ctx[27];
    	validate_each_keys(ctx, each_value_7, get_each_context_7, get_key);

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		let child_ctx = get_each_context_7(ctx, each_value_7, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_7(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "column svelte-4gs6t4");
    			add_location(div, file, 246, 16, 8941);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(246:12) {#each Array(5) as _, indexCol (indexCol)}",
    		ctx
    	});

    	return block;
    }

    // (255:20) {#each Array(5) as _, indexPix (indexPix)}
    function create_each_block_5(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pixel frame-pixel svelte-4gs6t4");
    			add_location(div, file, 255, 24, 9340);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(255:20) {#each Array(5) as _, indexPix (indexPix)}",
    		ctx
    	});

    	return block;
    }

    // (258:20) {#each Array(17) as _, indexPix (indexPix)}
    function create_each_block_4(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "pixel-" + /*indexCol*/ ctx[25] + "-" + /*indexPix*/ ctx[27]);
    			attr_dev(div, "class", "pixel canvas-pixel svelte-4gs6t4");
    			add_location(div, file, 258, 24, 9494);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(258:20) {#each Array(17) as _, indexPix (indexPix)}",
    		ctx
    	});

    	return block;
    }

    // (261:20) {#each Array(5) as _, indexPix (indexPix)}
    function create_each_block_3(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pixel frame-pixel svelte-4gs6t4");
    			add_location(div, file, 261, 24, 9681);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(261:20) {#each Array(5) as _, indexPix (indexPix)}",
    		ctx
    	});

    	return block;
    }

    // (253:12) {#each Array(106) as _, indexCol (indexCol)}
    function create_each_block_2(key_1, ctx) {
    	let div;
    	let each_blocks_2 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let each_blocks_1 = [];
    	let each1_lookup = new Map();
    	let t1;
    	let each_blocks = [];
    	let each2_lookup = new Map();
    	let each_value_5 = Array(5);
    	validate_each_argument(each_value_5);
    	const get_key = ctx => /*indexPix*/ ctx[27];
    	validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		let child_ctx = get_each_context_5(ctx, each_value_5, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_2[i] = create_each_block_5(key, child_ctx));
    	}

    	let each_value_4 = Array(17);
    	validate_each_argument(each_value_4);
    	const get_key_1 = ctx => /*indexPix*/ ctx[27];
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key_1);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks_1[i] = create_each_block_4(key, child_ctx));
    	}

    	let each_value_3 = Array(5);
    	validate_each_argument(each_value_3);
    	const get_key_2 = ctx => /*indexPix*/ ctx[27];
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key_2);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key_2(child_ctx);
    		each2_lookup.set(key, each_blocks[i] = create_each_block_3(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "column svelte-4gs6t4");
    			add_location(div, file, 253, 16, 9232);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div, null);
    			}

    			append_dev(div, t0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*Array*/ 0) {
    				each_value_4 = Array(17);
    				validate_each_argument(each_value_4);
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key_1);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_1, 1, ctx, each_value_4, each1_lookup, div, destroy_block, create_each_block_4, t1, get_each_context_4);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].d();
    			}

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(253:12) {#each Array(106) as _, indexCol (indexCol)}",
    		ctx
    	});

    	return block;
    }

    // (268:20) {#each Array(27) as _, indexPix (indexPix)}
    function create_each_block_1(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pixel frame-pixel svelte-4gs6t4");
    			add_location(div, file, 268, 24, 9970);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(268:20) {#each Array(27) as _, indexPix (indexPix)}",
    		ctx
    	});

    	return block;
    }

    // (266:12) {#each Array(5) as _, indexCol (indexCol)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_1 = Array(27);
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*indexPix*/ ctx[27];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "column svelte-4gs6t4");
    			add_location(div, file, 266, 16, 9861);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(266:12) {#each Array(5) as _, indexCol (indexCol)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div27;
    	let div21;
    	let div0;
    	let each_blocks_2 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let each_blocks_1 = [];
    	let each1_lookup = new Map();
    	let t1;
    	let each_blocks = [];
    	let each2_lookup = new Map();
    	let t2;
    	let canvas;
    	let b0;
    	let i0;
    	let canvas_width_value;
    	let canvas_height_value;
    	let t4;
    	let div1;
    	let t5;
    	let div2;
    	let t6;
    	let div3;
    	let t7;
    	let div4;
    	let t8;
    	let div12;
    	let div5;
    	let t9;
    	let div6;
    	let t10;
    	let div11;
    	let div7;
    	let b1;
    	let t12;
    	let div10;
    	let div8;
    	let b2;
    	let i1;
    	let t14;
    	let div9;
    	let b3;
    	let i2;
    	let t16;
    	let div20;
    	let div13;
    	let t17;
    	let div14;
    	let t18;
    	let div19;
    	let div15;
    	let b4;
    	let t20;
    	let div18;
    	let div16;
    	let b5;
    	let i3;
    	let t22;
    	let div17;
    	let b6;
    	let i4;
    	let t24;
    	let div25;
    	let div22;
    	let button0;
    	let i5;
    	let t25;
    	let sub;
    	let t26;
    	let t27;
    	let textarea;
    	let t28;
    	let div24;
    	let button1;
    	let t29;
    	let t30;
    	let button2;
    	let t31;
    	let t32;
    	let button3;
    	let t33;
    	let t34;
    	let div23;
    	let button4;
    	let t35;
    	let button5;
    	let t36;
    	let button6;
    	let t37;
    	let div26;
    	let mounted;
    	let dispose;
    	let each_value_6 = Array(5);
    	validate_each_argument(each_value_6);
    	const get_key = ctx => /*indexCol*/ ctx[25];
    	validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		let child_ctx = get_each_context_6(ctx, each_value_6, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_2[i] = create_each_block_6(key, child_ctx));
    	}

    	let each_value_2 = Array(106);
    	validate_each_argument(each_value_2);
    	const get_key_1 = ctx => /*indexCol*/ ctx[25];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_1);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value = Array(5);
    	validate_each_argument(each_value);
    	const get_key_2 = ctx => /*indexCol*/ ctx[25];
    	validate_each_keys(ctx, each_value, get_each_context, get_key_2);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key_2(child_ctx);
    		each2_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div27 = element("div");
    			div21 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			canvas = element("canvas");
    			b0 = element("b");
    			i0 = element("i");
    			i0.textContent = "Your browser does not support canvas element.";
    			t4 = space();
    			div1 = element("div");
    			t5 = space();
    			div2 = element("div");
    			t6 = space();
    			div3 = element("div");
    			t7 = space();
    			div4 = element("div");
    			t8 = space();
    			div12 = element("div");
    			div5 = element("div");
    			t9 = space();
    			div6 = element("div");
    			t10 = space();
    			div11 = element("div");
    			div7 = element("div");
    			b1 = element("b");
    			b1.textContent = "Y";
    			t12 = space();
    			div10 = element("div");
    			div8 = element("div");
    			b2 = element("b");
    			i1 = element("i");
    			i1.textContent = "k";
    			t14 = space();
    			div9 = element("div");
    			b3 = element("b");
    			i2 = element("i");
    			i2.textContent = "k+17";
    			t16 = space();
    			div20 = element("div");
    			div13 = element("div");
    			t17 = space();
    			div14 = element("div");
    			t18 = space();
    			div19 = element("div");
    			div15 = element("div");
    			b4 = element("b");
    			b4.textContent = "X";
    			t20 = space();
    			div18 = element("div");
    			div16 = element("div");
    			b5 = element("b");
    			i3 = element("i");
    			i3.textContent = "0";
    			t22 = space();
    			div17 = element("div");
    			b6 = element("b");
    			i4 = element("i");
    			i4.textContent = "106";
    			t24 = space();
    			div25 = element("div");
    			div22 = element("div");
    			button0 = element("button");
    			i5 = element("i");
    			t25 = text("k");
    			sub = element("sub");
    			t26 = text(/*kValueBase*/ ctx[1]);
    			t27 = space();
    			textarea = element("textarea");
    			t28 = space();
    			div24 = element("div");
    			button1 = element("button");
    			t29 = text("Comment");
    			t30 = space();
    			button2 = element("button");
    			t31 = text("Paste");
    			t32 = space();
    			button3 = element("button");
    			t33 = text("Copy");
    			t34 = space();
    			div23 = element("div");
    			button4 = element("button");
    			t35 = space();
    			button5 = element("button");
    			t36 = space();
    			button6 = element("button");
    			t37 = space();
    			div26 = element("div");
    			attr_dev(div0, "id", "greater-canvas");
    			attr_dev(div0, "class", "greater-canvas svelte-4gs6t4");
    			set_style(div0, "--pixelSize", /*pixelSize*/ ctx[2] + "px");
    			add_location(div0, file, 244, 8, 8785);
    			add_location(i0, file, 278, 23, 10643);
    			add_location(b0, file, 278, 20, 10640);
    			attr_dev(canvas, "id", "canvas");
    			attr_dev(canvas, "class", "canvas svelte-4gs6t4");
    			attr_dev(canvas, "width", canvas_width_value = 106 * /*pixelSize*/ ctx[2]);
    			attr_dev(canvas, "height", canvas_height_value = 17 * /*pixelSize*/ ctx[2]);
    			set_style(canvas, "top", 5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(canvas, "left", 5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(canvas, file, 275, 8, 10199);
    			attr_dev(div1, "class", "canvas-overlay-left-gradient svelte-4gs6t4");
    			set_style(div1, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div1, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div1, file, 282, 8, 10790);
    			attr_dev(div2, "class", "canvas-overlay-top-gradient svelte-4gs6t4");
    			set_style(div2, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div2, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div2, file, 283, 8, 10908);
    			attr_dev(div3, "class", "canvas-overlay-right-gradient svelte-4gs6t4");
    			set_style(div3, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div3, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div3, file, 284, 8, 11026);
    			attr_dev(div4, "class", "canvas-overlay-bot-gradient svelte-4gs6t4");
    			set_style(div4, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div4, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div4, file, 285, 8, 11145);
    			attr_dev(div5, "class", "canvas-overlay-axis-y-arrow-body svelte-4gs6t4");
    			add_location(div5, file, 289, 12, 11459);
    			attr_dev(div6, "class", "canvas-overlay-axis-y-arrow-head svelte-4gs6t4");
    			set_style(div6, "width", /*pixelSize*/ ctx[2] + "px");
    			set_style(div6, "height", /*pixelSize*/ ctx[2] + "px");
    			set_style(div6, "top", /*pixelSize*/ ctx[2] / 5 + "px");
    			add_location(div6, file, 290, 12, 11524);
    			add_location(b1, file, 292, 154, 11927);
    			attr_dev(div7, "class", "canvas-overlay-axis-y-arrow-rest-name svelte-4gs6t4");
    			set_style(div7, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			set_style(div7, "right", /*pixelSize*/ ctx[2] * -1.5 + "px");
    			set_style(div7, "top", /*pixelSize*/ ctx[2] + "px");
    			add_location(div7, file, 292, 16, 11789);
    			add_location(i1, file, 294, 171, 12243);
    			add_location(b2, file, 294, 168, 12240);
    			attr_dev(div8, "class", "canvas-overlay-axis-y-arrow-rest-dash-first svelte-4gs6t4");
    			set_style(div8, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			set_style(div8, "right", /*pixelSize*/ ctx[2] / 2 + "px");
    			set_style(div8, "bottom", /*pixelSize*/ ctx[2] / 5 + "px");
    			add_location(div8, file, 294, 20, 12092);
    			add_location(i2, file, 295, 168, 12430);
    			add_location(b3, file, 295, 165, 12427);
    			attr_dev(div9, "class", "canvas-overlay-axis-y-arrow-rest-dash-last svelte-4gs6t4");
    			set_style(div9, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			set_style(div9, "right", /*pixelSize*/ ctx[2] / 2 + "px");
    			set_style(div9, "top", /*pixelSize*/ ctx[2] * -1 + "px");
    			add_location(div9, file, 295, 20, 12282);
    			attr_dev(div10, "class", "canvas-overlay-axis-y-arrow-rest-dash svelte-4gs6t4");
    			set_style(div10, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div10, "height", 17 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div10, file, 293, 16, 11959);
    			attr_dev(div11, "class", "canvas-overlay-axis-y-arrow-rest svelte-4gs6t4");
    			set_style(div11, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div11, "height", 22 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div11, file, 291, 12, 11665);
    			attr_dev(div12, "class", "canvas-overlay-axis-y svelte-4gs6t4");
    			set_style(div12, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div12, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div12, file, 288, 8, 11350);
    			attr_dev(div13, "class", "canvas-overlay-axis-x-arrow-body svelte-4gs6t4");
    			add_location(div13, file, 302, 12, 12714);
    			attr_dev(div14, "class", "canvas-overlay-axis-x-arrow-head svelte-4gs6t4");
    			set_style(div14, "width", /*pixelSize*/ ctx[2] + "px");
    			set_style(div14, "height", /*pixelSize*/ ctx[2] + "px");
    			set_style(div14, "right", /*pixelSize*/ ctx[2] / 5 + "px");
    			add_location(div14, file, 303, 12, 12780);
    			add_location(b4, file, 305, 158, 13190);
    			attr_dev(div15, "class", "canvas-overlay-axis-x-arrow-rest-name svelte-4gs6t4");
    			set_style(div15, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			set_style(div15, "right", /*pixelSize*/ ctx[2] * 1.3 + "px");
    			set_style(div15, "top", /*pixelSize*/ ctx[2] * -2 + "px");
    			add_location(div15, file, 305, 16, 13048);
    			add_location(i3, file, 307, 143, 13479);
    			add_location(b5, file, 307, 140, 13476);
    			attr_dev(div16, "class", "canvas-overlay-axis-x-arrow-rest-dash-first svelte-4gs6t4");
    			set_style(div16, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			set_style(div16, "left", /*pixelSize*/ ctx[2] / 5 + "px");
    			add_location(div16, file, 307, 20, 13356);
    			add_location(i4, file, 308, 144, 13642);
    			add_location(b6, file, 308, 141, 13639);
    			attr_dev(div17, "class", "canvas-overlay-axis-x-arrow-rest-dash-last svelte-4gs6t4");
    			set_style(div17, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			set_style(div17, "right", /*pixelSize*/ ctx[2] * -1 + "px");
    			add_location(div17, file, 308, 20, 13518);
    			attr_dev(div18, "class", "canvas-overlay-axis-x-arrow-rest-dash svelte-4gs6t4");
    			set_style(div18, "width", 106 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div18, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div18, file, 306, 16, 13222);
    			attr_dev(div19, "class", "canvas-overlay-axis-x-arrow-rest svelte-4gs6t4");
    			set_style(div19, "width", 111 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div19, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div19, file, 304, 12, 12923);
    			attr_dev(div20, "class", "canvas-overlay-axis-x svelte-4gs6t4");
    			set_style(div20, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div20, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div20, file, 301, 8, 12604);
    			attr_dev(div21, "id", "frame");
    			attr_dev(div21, "class", "frame svelte-4gs6t4");
    			set_style(div21, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div21, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div21, file, 243, 4, 8683);
    			add_location(sub, file, 317, 165, 14203);
    			add_location(i5, file, 317, 161, 14199);
    			attr_dev(button0, "type", "button");
    			set_style(button0, "font-size", 2 * /*pixelSize*/ ctx[2] - 4 + "px");
    			set_style(button0, "width", 8 * /*pixelSize*/ ctx[2] + "px");
    			set_style(button0, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			attr_dev(button0, "class", "svelte-4gs6t4");
    			add_location(button0, file, 317, 12, 14050);
    			attr_dev(textarea, "id", "textarea");
    			set_style(textarea, "line-height", 2.5 * /*pixelSize*/ ctx[2] - 1 + "px");
    			set_style(textarea, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			set_style(textarea, "width", 88 * /*pixelSize*/ ctx[2] + "px");
    			set_style(textarea, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			attr_dev(textarea, "class", "svelte-4gs6t4");
    			add_location(textarea, file, 318, 12, 14252);
    			attr_dev(div22, "class", "k-buttons-value svelte-4gs6t4");
    			set_style(div22, "width", 96 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div22, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div22, file, 316, 8, 13944);
    			attr_dev(button1, "class", "k-buttons-action-comment svelte-4gs6t4");
    			attr_dev(button1, "type", "button");
    			set_style(button1, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			set_style(button1, "width", 12 * /*pixelSize*/ ctx[2] + "px");
    			set_style(button1, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(button1, file, 321, 12, 14644);
    			attr_dev(button2, "class", "k-buttons-action-paste svelte-4gs6t4");
    			attr_dev(button2, "type", "button");
    			set_style(button2, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			set_style(button2, "width", 12 * /*pixelSize*/ ctx[2] + "px");
    			set_style(button2, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(button2, file, 322, 12, 14866);
    			attr_dev(button3, "class", "k-buttons-action-copy svelte-4gs6t4");
    			attr_dev(button3, "type", "button");
    			set_style(button3, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			set_style(button3, "width", 12 * /*pixelSize*/ ctx[2] + "px");
    			set_style(button3, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(button3, file, 323, 12, 15072);
    			attr_dev(button4, "class", "k-buttons-action-options-tutorial svelte-4gs6t4");
    			attr_dev(button4, "type", "button");
    			set_style(button4, "width", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(button4, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(button4, file, 325, 16, 15393);
    			attr_dev(button5, "class", "k-buttons-action-options-select svelte-4gs6t4");
    			attr_dev(button5, "type", "button");
    			set_style(button5, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			set_style(button5, "width", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(button5, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(button5, file, 326, 16, 15547);
    			attr_dev(button6, "class", "k-buttons-action-options-clear svelte-4gs6t4");
    			attr_dev(button6, "type", "button");
    			set_style(button6, "width", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			set_style(button6, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(button6, file, 327, 16, 15733);
    			attr_dev(div23, "class", "k-buttons-action-options svelte-4gs6t4");
    			set_style(div23, "width", 50 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div23, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div23, file, 324, 12, 15275);
    			attr_dev(div24, "class", "k-buttons-action svelte-4gs6t4");
    			set_style(div24, "width", 96 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div24, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div24, file, 320, 9, 14538);
    			attr_dev(div25, "class", "k-buttons svelte-4gs6t4");
    			set_style(div25, "width", 96 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div25, "height", 6 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div25, "padding-top", /*pixelSize*/ ctx[2] / 2 + "px");
    			set_style(div25, "padding-bottom", /*pixelSize*/ ctx[2] / 2 + "px");
    			add_location(div25, file, 315, 4, 13783);
    			attr_dev(div26, "class", "canvas-error canvas-active canvas-success canvas-pixel-active svelte-4gs6t4");
    			set_style(div26, "display", "none");
    			add_location(div26, file, 333, 4, 16036);
    			attr_dev(div27, "class", "container svelte-4gs6t4");
    			set_style(div27, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			set_style(div27, "height", 34 * /*pixelSize*/ ctx[2] + "px");
    			add_location(div27, file, 242, 0, 8592);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div27, anchor);
    			append_dev(div27, div21);
    			append_dev(div21, div0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div0, null);
    			}

    			append_dev(div0, t0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div0, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div21, t2);
    			append_dev(div21, canvas);
    			append_dev(canvas, b0);
    			append_dev(b0, i0);
    			append_dev(div21, t4);
    			append_dev(div21, div1);
    			append_dev(div21, t5);
    			append_dev(div21, div2);
    			append_dev(div21, t6);
    			append_dev(div21, div3);
    			append_dev(div21, t7);
    			append_dev(div21, div4);
    			append_dev(div21, t8);
    			append_dev(div21, div12);
    			append_dev(div12, div5);
    			append_dev(div12, t9);
    			append_dev(div12, div6);
    			append_dev(div12, t10);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			append_dev(div7, b1);
    			append_dev(div11, t12);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, b2);
    			append_dev(b2, i1);
    			append_dev(div10, t14);
    			append_dev(div10, div9);
    			append_dev(div9, b3);
    			append_dev(b3, i2);
    			append_dev(div21, t16);
    			append_dev(div21, div20);
    			append_dev(div20, div13);
    			append_dev(div20, t17);
    			append_dev(div20, div14);
    			append_dev(div20, t18);
    			append_dev(div20, div19);
    			append_dev(div19, div15);
    			append_dev(div15, b4);
    			append_dev(div19, t20);
    			append_dev(div19, div18);
    			append_dev(div18, div16);
    			append_dev(div16, b5);
    			append_dev(b5, i3);
    			append_dev(div18, t22);
    			append_dev(div18, div17);
    			append_dev(div17, b6);
    			append_dev(b6, i4);
    			append_dev(div27, t24);
    			append_dev(div27, div25);
    			append_dev(div25, div22);
    			append_dev(div22, button0);
    			append_dev(button0, i5);
    			append_dev(i5, t25);
    			append_dev(i5, sub);
    			append_dev(sub, t26);
    			append_dev(div22, t27);
    			append_dev(div22, textarea);
    			set_input_value(textarea, /*kValueString*/ ctx[0]);
    			append_dev(div25, t28);
    			append_dev(div25, div24);
    			append_dev(div24, button1);
    			append_dev(button1, t29);
    			append_dev(div24, t30);
    			append_dev(div24, button2);
    			append_dev(button2, t31);
    			append_dev(div24, t32);
    			append_dev(div24, button3);
    			append_dev(button3, t33);
    			append_dev(div24, t34);
    			append_dev(div24, div23);
    			append_dev(div23, button4);
    			append_dev(div23, t35);
    			append_dev(div23, button5);
    			append_dev(div23, t36);
    			append_dev(div23, button6);
    			append_dev(div27, t37);
    			append_dev(div27, div26);

    			if (!mounted) {
    				dispose = [
    					listen_dev(canvas, "pointerdown", /*handleCanvasPointerDown*/ ctx[3], false, false, false),
    					listen_dev(canvas, "pointermove", /*handleCanvasPointerMove*/ ctx[4], false, false, false),
    					listen_dev(canvas, "pointerup", /*handleCanvasPointerUp*/ ctx[5], false, false, false),
    					listen_dev(canvas, "pointerleave", /*handleCanvasPointerLeave*/ ctx[6], false, false, false),
    					listen_dev(canvas, "pointercancel", /*handleCanvasPointerCancel*/ ctx[7], false, false, false),
    					listen_dev(canvas, "dragstart", /*handleCanvasDragStart*/ ctx[8], false, false, false),
    					listen_dev(button0, "click", /*kValueDisplayButton*/ ctx[9], false, false, false),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[13]),
    					listen_dev(textarea, "input", /*kValueChangeHandler*/ ctx[12], false, false, false),
    					listen_dev(textarea, "focusout", /*kValueChangeHandler*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", kValueCommentButton, false, false, false),
    					listen_dev(button2, "click", /*kValuePasteButton*/ ctx[11], false, false, false),
    					listen_dev(button3, "click", /*kValueCopyButton*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array*/ 0) {
    				each_value_6 = Array(5);
    				validate_each_argument(each_value_6);
    				validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);
    				each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key, 1, ctx, each_value_6, each0_lookup, div0, destroy_block, create_each_block_6, t0, get_each_context_6);
    			}

    			if (dirty & /*Array*/ 0) {
    				each_value_2 = Array(106);
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_1);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_1, 1, ctx, each_value_2, each1_lookup, div0, destroy_block, create_each_block_2, t1, get_each_context_2);
    			}

    			if (dirty & /*Array*/ 0) {
    				each_value = Array(5);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key_2);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_2, 1, ctx, each_value, each2_lookup, div0, destroy_block, create_each_block, null, get_each_context);
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div0, "--pixelSize", /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4 && canvas_width_value !== (canvas_width_value = 106 * /*pixelSize*/ ctx[2])) {
    				attr_dev(canvas, "width", canvas_width_value);
    			}

    			if (dirty[0] & /*pixelSize*/ 4 && canvas_height_value !== (canvas_height_value = 17 * /*pixelSize*/ ctx[2])) {
    				attr_dev(canvas, "height", canvas_height_value);
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(canvas, "top", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(canvas, "left", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div1, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div1, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div2, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div2, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div3, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div3, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div4, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div4, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div6, "width", /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div6, "height", /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div6, "top", /*pixelSize*/ ctx[2] / 5 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div7, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div7, "right", /*pixelSize*/ ctx[2] * -1.5 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div7, "top", /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div8, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div8, "right", /*pixelSize*/ ctx[2] / 2 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div8, "bottom", /*pixelSize*/ ctx[2] / 5 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div9, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div9, "right", /*pixelSize*/ ctx[2] / 2 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div9, "top", /*pixelSize*/ ctx[2] * -1 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div10, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div10, "height", 17 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div11, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div11, "height", 22 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div12, "width", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div12, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div14, "width", /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div14, "height", /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div14, "right", /*pixelSize*/ ctx[2] / 5 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div15, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div15, "right", /*pixelSize*/ ctx[2] * 1.3 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div15, "top", /*pixelSize*/ ctx[2] * -2 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div16, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div16, "left", /*pixelSize*/ ctx[2] / 5 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div17, "font-size", /*pixelSize*/ ctx[2] / 10 + "em");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div17, "right", /*pixelSize*/ ctx[2] * -1 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div18, "width", 106 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div18, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div19, "width", 111 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div19, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div20, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div20, "height", 5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div21, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div21, "height", 27 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*kValueBase*/ 2) set_data_dev(t26, /*kValueBase*/ ctx[1]);

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button0, "font-size", 2 * /*pixelSize*/ ctx[2] - 4 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button0, "width", 8 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button0, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(textarea, "line-height", 2.5 * /*pixelSize*/ ctx[2] - 1 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(textarea, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(textarea, "width", 88 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(textarea, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*kValueString*/ 1) {
    				set_input_value(textarea, /*kValueString*/ ctx[0]);
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div22, "width", 96 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div22, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button1, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button1, "width", 12 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button1, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button2, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button2, "width", 12 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button2, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button3, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button3, "width", 12 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button3, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button4, "width", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button4, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button5, "font-size", 2 * /*pixelSize*/ ctx[2] - 6 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button5, "width", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button5, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button6, "width", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(button6, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div23, "width", 50 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div23, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div24, "width", 96 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div24, "height", 2.5 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div25, "width", 96 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div25, "height", 6 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div25, "padding-top", /*pixelSize*/ ctx[2] / 2 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div25, "padding-bottom", /*pixelSize*/ ctx[2] / 2 + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div27, "width", 116 * /*pixelSize*/ ctx[2] + "px");
    			}

    			if (dirty[0] & /*pixelSize*/ 4) {
    				set_style(div27, "height", 34 * /*pixelSize*/ ctx[2] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div27);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].d();
    			}

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function kValueCommentButton() {
    	alert('TODO!');
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, []);
    	let kValueString = 'Click on the canvas and see what happens to me!';
    	let kValueBinary = ('0').repeat(1802);
    	let kValueBase = 'dec';
    	const ongoingTouches = [];
    	let isInCanvasMode = false;
    	let isValueUpToDate = true;
    	let isPointerDown = false;
    	let isInBrushMode = true;
    	let pixelSize = 0;
    	const windowWidth = window.innerWidth;
    	const windowHeight = window.innerHeight;

    	/* needs a tonne of work! */
    	if (windowWidth > windowHeight) {
    		let w = Math.floor(windowWidth / 116);
    		let h = Math.floor(windowHeight / 33);
    		pixelSize = w > h ? h : w;
    		pixelSize = pixelSize <= 16 ? pixelSize : 16;
    		pixelSize = pixelSize >= 4 ? pixelSize : 4;
    	} else {
    		/* portrait mode */
    		let w = Math.floor(windowWidth / 33);

    		let h = Math.floor(windowHeight / 116);
    		pixelSize = w > h ? h : w;
    		pixelSize = pixelSize <= 16 ? pixelSize : 16;
    		pixelSize = pixelSize >= 4 ? pixelSize : 4;
    	}

    	function matrixFillPixel(x, y) {
    		let pixelCol = x;
    		let pixelRow = 16 - y; /* 16 to reverse */
    		let pixelID = `pixel-${pixelCol}-${pixelRow}`;
    		let pixelElement = document.getElementById(pixelID);

    		if (isInBrushMode) {
    			kValueBinary = setCharAt(kValueBinary, pixelCol * 17 + pixelRow, '1');
    			pixelElement.classList.add("canvas-pixel-active");
    		} else {
    			kValueBinary = setCharAt(kValueBinary, pixelCol * 17 + pixelRow, '0');
    			pixelElement.classList.remove("canvas-pixel-active");
    		}

    		/* real-time base conversion *heavy* */
    		$$invalidate(0, kValueString = kValueBinaryToBase(kValueBinary, kValueBase));
    	}

    	/* wake up babe, new events just dropped! */
    	function handleCanvasPointerDown(e) {
    		//console.log(`pointerdown: id = ${e.pointerId}.`);
    		e.target.classList.add("canvas-active");

    		e.target.classList.remove("canvas-error");
    		e.target.classList.remove("canvas-success");
    		ongoingTouches.push(copyCanvasTouch(e));
    		isPointerDown = true;

    		/* calculate the PseudoPixel coordinates */
    		let pixelCol = Math.floor(e.layerX / pixelSize);

    		let pixelRow = Math.floor(e.layerY / pixelSize);

    		//console.log(`start drawing at: ${pixelCol}, ${pixelRow}.`);
    		matrixFillPixel(pixelCol, pixelRow);
    	}

    	function handleCanvasPointerMove(e) {
    		if (!isPointerDown) return;

    		/* find the touchID that is being continued here */
    		const index = findTouchIndexById(ongoingTouches, e.pointerId);

    		if (index >= 0) {
    			//console.log(`continuing ongoing touch: index = ${index}.`);
    			/* get an array of all PseudoPixels on the traversed line */
    			let pixelArray = getPixelsOnTheLine(ongoingTouches[index].layerX, ongoingTouches[index].layerY, e.layerX, e.layerY, pixelSize);

    			/* fill the line */
    			if (pixelArray.length > 0) {
    				//console.log(`drawing line from: ${pixelArray[0]}.`);
    				for (let i = 0; i < pixelArray.length; i++) {
    					let pixelCol = pixelArray[i][0];
    					let pixelRow = pixelArray[i][1];

    					if (pixelCol > 105 || pixelRow > 16 || pixelRow < 0 || pixelCol < 0) {
    						//console.log(`canceled: ${pixelCol}, ${pixelRow} out of bounds!`);
    						isPointerDown = false;

    						break;
    					}

    					matrixFillPixel(pixelCol, pixelRow);
    				}
    			} //console.log(`drawing line to: ${pixelArray[pixelArray.length - 1]}.`);

    			/* swap in the new touch record */
    			ongoingTouches.splice(index, 1, copyCanvasTouch(e));
    		}
    	}

    	function handleCanvasPointerUp(e) {
    		if (!isPointerDown) return false;
    		isPointerDown = false;
    		e.target.classList.add("canvas-success");
    		e.target.classList.remove("canvas-error");
    		e.target.classList.remove("canvas-active");

    		setTimeout(
    			() => {
    				e.target.classList.remove("canvas-success");
    			},
    			330
    		);

    		/* find the touchID that is being ended here */
    		const index = findTouchIndexById(ongoingTouches, e.pointerId);

    		if (index >= 0) {
    			/* remove it, we're done */
    			ongoingTouches.splice(index, 1);
    		}
    	}

    	function handleCanvasPointerLeave(e) {
    		if (!isPointerDown) return false;
    		isPointerDown = false;
    		e.target.classList.add("canvas-error");
    		e.target.classList.remove("canvas-active");
    		e.target.classList.remove("canvas-success");

    		setTimeout(
    			() => {
    				e.target.classList.remove("canvas-error");
    			},
    			330
    		);

    		/* find the touchID that is being ended here */
    		const index = findTouchIndexById(ongoingTouches, e.pointerId);

    		if (index >= 0) {
    			/* remove it, we're done */
    			ongoingTouches.splice(index, 1);
    		}
    	}

    	function handleCanvasPointerCancel(e) {
    		if (!isPointerDown) return false;
    		isPointerDown = false;
    		e.target.classList.add("canvas-error");
    		e.target.classList.remove("canvas-active");
    		e.target.classList.remove("canvas-success");

    		setTimeout(
    			() => {
    				e.target.classList.remove("canvas-error");
    			},
    			330
    		);

    		/* find the touchID that is being ended here */
    		const index = findTouchIndexById(ongoingTouches, e.pointerId);

    		if (index >= 0) {
    			/* remove it, we're done */
    			ongoingTouches.splice(index, 1);
    		}
    	}

    	function handleCanvasDragStart(e) {
    		isPointerDown = false;
    		e.preventDefault();
    		return false;
    	}

    	/* k-value and its posse */
    	function kValueDisplayButton() {
    		if (kValueBase === 'b64') {
    			$$invalidate(1, kValueBase = 'dec');
    		} else if (kValueBase === 'dec') {
    			$$invalidate(1, kValueBase = 'bin');
    		} else if (kValueBase === 'bin') {
    			$$invalidate(1, kValueBase = 'b64');
    		} else {
    			/* default */
    			$$invalidate(1, kValueBase = 'dec');
    		}

    		$$invalidate(0, kValueString = kValueBinaryToBase(kValueBinary, kValueBase));
    	}

    	function kValueCopyButton() {
    		const targetElement = document.getElementById("textarea");
    		targetElement.classList.add("canvas-active");
    		navigator.clipboard.writeText(kValueString);

    		setTimeout(
    			() => {
    				targetElement.classList.remove("canvas-active");
    			},
    			330
    		);
    	}

    	function kValuePasteButton() {
    		if (typeof navigator.clipboard.readText === "function") {
    			navigator.clipboard.readText().then(clipText => $$invalidate(0, kValueString = clipText));
    			const targetElement = document.getElementById("textarea");
    			targetElement.classList.add("canvas-success");
    			kValueChangeHandler();

    			setTimeout(
    				() => {
    					targetElement.classList.remove("canvas-success");
    				},
    				330
    			);
    		} else {
    			alert('Browser clipboard access refused, please paste manually.');
    		}
    	}

    	function kValueChangeHandler() {
    		let kValueBinaryTemp = kValueBaseToBinary(kValueString, kValueBase);
    		let targetElement = document.getElementById('textarea');
    		let kValueError = false;

    		if (kValueBinaryTemp.length === 1802) {
    			for (let i = 0; i < 1802; i++) {
    				if (kValueBinaryTemp[i] !== '0' && kValueBinaryTemp[i] !== '1') {
    					kValueError = true;
    					break;
    				}
    			}

    			/* input is good, daddy-O! */
    			if (kValueError === false) {
    				kValueBinary = kValueBinaryTemp;
    			}
    		} else {
    			/* input is bad */
    			kValueError = true;
    		}

    		/* don't get too antsy with it if textarea is still focused */
    		if (kValueError && document.activeElement === targetElement) {
    			targetElement.classList.add("canvas-error");
    			return;
    		} else {
    			/* but if it's not... */
    			/* revert to the last good k-value available */
    			$$invalidate(0, kValueString = kValueBinaryToBase(kValueBinary, kValueBase));
    		}

    		/* k-value is good, one way or another */
    		targetElement.classList.remove("canvas-error");
    	}
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		kValueString = this.value;
    		$$invalidate(0, kValueString);
    	}

    	$$self.$capture_state = () => ({
    		kValueBaseToBinary,
    		kValueBinaryToBase,
    		setCharAt,
    		getPixelsOnTheLine,
    		findTouchIndexById,
    		copyCanvasTouch,
    		kValueString,
    		kValueBinary,
    		kValueBase,
    		ongoingTouches,
    		isInCanvasMode,
    		isValueUpToDate,
    		isPointerDown,
    		isInBrushMode,
    		pixelSize,
    		windowWidth,
    		windowHeight,
    		matrixFillPixel,
    		handleCanvasPointerDown,
    		handleCanvasPointerMove,
    		handleCanvasPointerUp,
    		handleCanvasPointerLeave,
    		handleCanvasPointerCancel,
    		handleCanvasDragStart,
    		kValueDisplayButton,
    		kValueCopyButton,
    		kValuePasteButton,
    		kValueCommentButton,
    		kValueChangeHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ('kValueString' in $$props) $$invalidate(0, kValueString = $$props.kValueString);
    		if ('kValueBinary' in $$props) kValueBinary = $$props.kValueBinary;
    		if ('kValueBase' in $$props) $$invalidate(1, kValueBase = $$props.kValueBase);
    		if ('isInCanvasMode' in $$props) isInCanvasMode = $$props.isInCanvasMode;
    		if ('isValueUpToDate' in $$props) isValueUpToDate = $$props.isValueUpToDate;
    		if ('isPointerDown' in $$props) isPointerDown = $$props.isPointerDown;
    		if ('isInBrushMode' in $$props) isInBrushMode = $$props.isInBrushMode;
    		if ('pixelSize' in $$props) $$invalidate(2, pixelSize = $$props.pixelSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		kValueString,
    		kValueBase,
    		pixelSize,
    		handleCanvasPointerDown,
    		handleCanvasPointerMove,
    		handleCanvasPointerUp,
    		handleCanvasPointerLeave,
    		handleCanvasPointerCancel,
    		handleCanvasDragStart,
    		kValueDisplayButton,
    		kValueCopyButton,
    		kValuePasteButton,
    		kValueChangeHandler,
    		textarea_input_handler
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */

    function create_fragment(ctx) {
    	let demo;
    	let current;
    	demo = new Canvas({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(demo.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(demo, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(demo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(demo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(demo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Demo: Canvas });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
