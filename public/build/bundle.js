
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
    function empty() {
        return text('');
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    /* src/demo/CanvasMatrix.svelte generated by Svelte v3.48.0 */

    const file$5 = "src/demo/CanvasMatrix.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (9:3) {#each Array(17) as _, index (index)}
    function create_each_block_1$1(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "matrix-pixel svelte-1itmtsg");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$5, 9, 4, 374);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(9:3) {#each Array(17) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (7:1) {#each Array(106) as _, index (index)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_1 = Array(17);
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
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
    			attr_dev(div, "class", "matrix-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$5, 7, 2, 244);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_1 = Array(17);
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1$1, t, get_each_context_1$1);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(7:1) {#each Array(106) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = Array(106);
    	validate_each_argument(each_value);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "matrix svelte-1itmtsg");
    			set_style(div, "width", 106 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$5, 5, 0, 118);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value = Array(106);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$1, null, get_each_context$1);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", 106 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CanvasMatrix', slots, []);
    	let { pixelSize } = $$props;
    	const writable_props = ['pixelSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CanvasMatrix> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	$$self.$capture_state = () => ({ pixelSize });

    	$$self.$inject_state = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pixelSize];
    }

    class CanvasMatrix extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { pixelSize: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CanvasMatrix",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pixelSize*/ ctx[0] === undefined && !('pixelSize' in props)) {
    			console.warn("<CanvasMatrix> was created without expected prop 'pixelSize'");
    		}
    	}

    	get pixelSize() {
    		throw new Error("<CanvasMatrix>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pixelSize(value) {
    		throw new Error("<CanvasMatrix>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/demo/CanvasDecore.svelte generated by Svelte v3.48.0 */
    const file$4 = "src/demo/CanvasDecore.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_10(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_11(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_12(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_13(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_14(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    function get_each_context_15(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (11:16) {#each Array(3) as _, index (index)}
    function create_each_block_15(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-outer-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 11, 20, 593);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_15.name,
    		type: "each",
    		source: "(11:16) {#each Array(3) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (9:8) {#each Array(116) as _, index (index)}
    function create_each_block_14(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_15 = Array(3);
    	validate_each_argument(each_value_15);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_15, get_each_context_15, get_key);

    	for (let i = 0; i < each_value_15.length; i += 1) {
    		let child_ctx = get_each_context_15(ctx, each_value_15, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_15(key, child_ctx));
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
    			attr_dev(div, "class", "decore-outer-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 9, 12, 430);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_15 = Array(3);
    				validate_each_argument(each_value_15);
    				validate_each_keys(ctx, each_value_15, get_each_context_15, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_15, each_1_lookup, div, destroy_block, create_each_block_15, t, get_each_context_15);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		id: create_each_block_14.name,
    		type: "each",
    		source: "(9:8) {#each Array(116) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (21:16) {#each Array(21) as _, index (index)}
    function create_each_block_13(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-outer-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 21, 20, 1074);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_13.name,
    		type: "each",
    		source: "(21:16) {#each Array(21) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (19:8) {#each Array(3) as _, index (index)}
    function create_each_block_12(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_13 = Array(21);
    	validate_each_argument(each_value_13);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_13, get_each_context_13, get_key);

    	for (let i = 0; i < each_value_13.length; i += 1) {
    		let child_ctx = get_each_context_13(ctx, each_value_13, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_13(key, child_ctx));
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
    			attr_dev(div, "class", "decore-outer-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 19, 12, 909);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_13 = Array(21);
    				validate_each_argument(each_value_13);
    				validate_each_keys(ctx, each_value_13, get_each_context_13, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_13, each_1_lookup, div, destroy_block, create_each_block_13, t, get_each_context_13);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		id: create_each_block_12.name,
    		type: "each",
    		source: "(19:8) {#each Array(3) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (32:20) {#each Array(2) as _, index (index)}
    function create_each_block_11(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-inner-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 32, 24, 1669);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_11.name,
    		type: "each",
    		source: "(32:20) {#each Array(2) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (30:12) {#each Array(110) as _, index (index)}
    function create_each_block_10(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_11 = Array(2);
    	validate_each_argument(each_value_11);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_11, get_each_context_11, get_key);

    	for (let i = 0; i < each_value_11.length; i += 1) {
    		let child_ctx = get_each_context_11(ctx, each_value_11, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_11(key, child_ctx));
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
    			attr_dev(div, "class", "decore-inner-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 30, 16, 1498);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_11 = Array(2);
    				validate_each_argument(each_value_11);
    				validate_each_keys(ctx, each_value_11, get_each_context_11, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_11, each_1_lookup, div, destroy_block, create_each_block_11, t, get_each_context_11);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		id: create_each_block_10.name,
    		type: "each",
    		source: "(30:12) {#each Array(110) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (42:20) {#each Array(17) as _, index (index)}
    function create_each_block_9(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-inner-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 42, 24, 2186);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_9.name,
    		type: "each",
    		source: "(42:20) {#each Array(17) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (40:12) {#each Array(2) as _, index (index)}
    function create_each_block_8(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_9 = Array(17);
    	validate_each_argument(each_value_9);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_9, get_each_context_9, get_key);

    	for (let i = 0; i < each_value_9.length; i += 1) {
    		let child_ctx = get_each_context_9(ctx, each_value_9, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_9(key, child_ctx));
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
    			attr_dev(div, "class", "decore-inner-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 40, 16, 2013);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_9 = Array(17);
    				validate_each_argument(each_value_9);
    				validate_each_keys(ctx, each_value_9, get_each_context_9, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_9, each_1_lookup, div, destroy_block, create_each_block_9, t, get_each_context_9);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(40:12) {#each Array(2) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (56:20) {#each Array(17) as _, index (index)}
    function create_each_block_7(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-inner-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 56, 24, 2876);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(56:20) {#each Array(17) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (54:12) {#each Array(2) as _, index (index)}
    function create_each_block_6(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_7 = Array(17);
    	validate_each_argument(each_value_7);
    	const get_key = ctx => /*index*/ ctx[3];
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

    			t = space();
    			attr_dev(div, "class", "decore-inner-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 54, 16, 2703);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_7 = Array(17);
    				validate_each_argument(each_value_7);
    				validate_each_keys(ctx, each_value_7, get_each_context_7, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_7, each_1_lookup, div, destroy_block, create_each_block_7, t, get_each_context_7);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		source: "(54:12) {#each Array(2) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (66:20) {#each Array(2) as _, index (index)}
    function create_each_block_5(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-inner-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 66, 24, 3393);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(66:20) {#each Array(2) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (64:12) {#each Array(110) as _, index (index)}
    function create_each_block_4(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_5 = Array(2);
    	validate_each_argument(each_value_5);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		let child_ctx = get_each_context_5(ctx, each_value_5, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_5(key, child_ctx));
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
    			attr_dev(div, "class", "decore-inner-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 64, 16, 3222);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_5 = Array(2);
    				validate_each_argument(each_value_5);
    				validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_5, each_1_lookup, div, destroy_block, create_each_block_5, t, get_each_context_5);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(64:12) {#each Array(110) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (77:16) {#each Array(21) as _, index (index)}
    function create_each_block_3(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-outer-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 77, 20, 3902);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(77:16) {#each Array(21) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (75:8) {#each Array(3) as _, index (index)}
    function create_each_block_2(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_3 = Array(21);
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3(key, child_ctx));
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
    			attr_dev(div, "class", "decore-outer-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 75, 12, 3737);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_3 = Array(21);
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, div, destroy_block, create_each_block_3, t, get_each_context_3);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(75:8) {#each Array(3) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (87:16) {#each Array(3) as _, index (index)}
    function create_each_block_1(key_1, ctx) {
    	let div;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "decore-outer-pixel svelte-1pbyvf5");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 87, 20, 4383);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(87:16) {#each Array(3) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (85:8) {#each Array(116) as _, index (index)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_1 = Array(3);
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*index*/ ctx[3];
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
    			attr_dev(div, "class", "decore-outer-column");
    			set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$4, 85, 12, 4220);
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

    			if (dirty & /*pixelSize*/ 1) {
    				each_value_1 = Array(3);
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1, t, get_each_context_1);
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			}
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
    		source: "(85:8) {#each Array(116) as _, index (index)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div10;
    	let div0;
    	let each_blocks_7 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let div1;
    	let each_blocks_6 = [];
    	let each1_lookup = new Map();
    	let t1;
    	let div7;
    	let div2;
    	let each_blocks_5 = [];
    	let each2_lookup = new Map();
    	let t2;
    	let div3;
    	let each_blocks_4 = [];
    	let each3_lookup = new Map();
    	let t3;
    	let div4;
    	let canvasmatrix;
    	let t4;
    	let div5;
    	let each_blocks_3 = [];
    	let each4_lookup = new Map();
    	let t5;
    	let div6;
    	let each_blocks_2 = [];
    	let each5_lookup = new Map();
    	let t6;
    	let div8;
    	let each_blocks_1 = [];
    	let each6_lookup = new Map();
    	let t7;
    	let div9;
    	let each_blocks = [];
    	let each7_lookup = new Map();
    	let current;
    	let each_value_14 = Array(116);
    	validate_each_argument(each_value_14);
    	const get_key = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_14, get_each_context_14, get_key);

    	for (let i = 0; i < each_value_14.length; i += 1) {
    		let child_ctx = get_each_context_14(ctx, each_value_14, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_7[i] = create_each_block_14(key, child_ctx));
    	}

    	let each_value_12 = Array(3);
    	validate_each_argument(each_value_12);
    	const get_key_1 = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_12, get_each_context_12, get_key_1);

    	for (let i = 0; i < each_value_12.length; i += 1) {
    		let child_ctx = get_each_context_12(ctx, each_value_12, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks_6[i] = create_each_block_12(key, child_ctx));
    	}

    	let each_value_10 = Array(110);
    	validate_each_argument(each_value_10);
    	const get_key_2 = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_10, get_each_context_10, get_key_2);

    	for (let i = 0; i < each_value_10.length; i += 1) {
    		let child_ctx = get_each_context_10(ctx, each_value_10, i);
    		let key = get_key_2(child_ctx);
    		each2_lookup.set(key, each_blocks_5[i] = create_each_block_10(key, child_ctx));
    	}

    	let each_value_8 = Array(2);
    	validate_each_argument(each_value_8);
    	const get_key_3 = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_8, get_each_context_8, get_key_3);

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		let child_ctx = get_each_context_8(ctx, each_value_8, i);
    		let key = get_key_3(child_ctx);
    		each3_lookup.set(key, each_blocks_4[i] = create_each_block_8(key, child_ctx));
    	}

    	canvasmatrix = new CanvasMatrix({
    			props: { pixelSize: /*pixelSize*/ ctx[0] },
    			$$inline: true
    		});

    	let each_value_6 = Array(2);
    	validate_each_argument(each_value_6);
    	const get_key_4 = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_6, get_each_context_6, get_key_4);

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		let child_ctx = get_each_context_6(ctx, each_value_6, i);
    		let key = get_key_4(child_ctx);
    		each4_lookup.set(key, each_blocks_3[i] = create_each_block_6(key, child_ctx));
    	}

    	let each_value_4 = Array(110);
    	validate_each_argument(each_value_4);
    	const get_key_5 = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key_5);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key_5(child_ctx);
    		each5_lookup.set(key, each_blocks_2[i] = create_each_block_4(key, child_ctx));
    	}

    	let each_value_2 = Array(3);
    	validate_each_argument(each_value_2);
    	const get_key_6 = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_6);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key_6(child_ctx);
    		each6_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value = Array(116);
    	validate_each_argument(each_value);
    	const get_key_7 = ctx => /*index*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context, get_key_7);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key_7(child_ctx);
    		each7_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].c();
    			}

    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].c();
    			}

    			t1 = space();
    			div7 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t2 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t3 = space();
    			div4 = element("div");
    			create_component(canvasmatrix.$$.fragment);
    			t4 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t5 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t6 = space();
    			div8 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			div9 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "decore-outer-top svelte-1pbyvf5");
    			set_style(div0, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div0, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div0, file$4, 7, 4, 278);
    			attr_dev(div1, "class", "decore-outer-left svelte-1pbyvf5");
    			set_style(div1, "width", 3 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div1, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div1, file$4, 17, 4, 759);
    			attr_dev(div2, "class", "decore-inner-top svelte-1pbyvf5");
    			set_style(div2, "width", 110 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div2, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div2, file$4, 28, 8, 1338);
    			attr_dev(div3, "class", "decore-inner-left svelte-1pbyvf5");
    			set_style(div3, "width", 2 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div3, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div3, file$4, 38, 8, 1855);
    			attr_dev(div4, "class", "matrix-container svelte-1pbyvf5");
    			set_style(div4, "width", 106 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div4, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div4, file$4, 48, 8, 2372);
    			attr_dev(div5, "class", "decore-inner-right svelte-1pbyvf5");
    			set_style(div5, "width", 2 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div5, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div5, file$4, 52, 8, 2544);
    			attr_dev(div6, "class", "decore-inner-bot svelte-1pbyvf5");
    			set_style(div6, "width", 110 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div6, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div6, file$4, 62, 8, 3062);
    			attr_dev(div7, "class", "decore-inner svelte-1pbyvf5");
    			set_style(div7, "width", 110 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div7, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div7, file$4, 27, 4, 1240);
    			attr_dev(div8, "class", "decore-outer-right svelte-1pbyvf5");
    			set_style(div8, "width", 3 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div8, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div8, file$4, 73, 4, 3586);
    			attr_dev(div9, "class", "decore-outer-bot svelte-1pbyvf5");
    			set_style(div9, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div9, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div9, file$4, 83, 4, 4068);
    			attr_dev(div10, "class", "decore svelte-1pbyvf5");
    			set_style(div10, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div10, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div10, file$4, 6, 0, 190);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].m(div0, null);
    			}

    			append_dev(div10, t0);
    			append_dev(div10, div1);

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].m(div1, null);
    			}

    			append_dev(div10, t1);
    			append_dev(div10, div7);
    			append_dev(div7, div2);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].m(div2, null);
    			}

    			append_dev(div7, t2);
    			append_dev(div7, div3);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(div3, null);
    			}

    			append_dev(div7, t3);
    			append_dev(div7, div4);
    			mount_component(canvasmatrix, div4, null);
    			append_dev(div7, t4);
    			append_dev(div7, div5);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div5, null);
    			}

    			append_dev(div7, t5);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div6, null);
    			}

    			append_dev(div10, t6);
    			append_dev(div10, div8);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div8, null);
    			}

    			append_dev(div10, t7);
    			append_dev(div10, div9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div9, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value_14 = Array(116);
    				validate_each_argument(each_value_14);
    				validate_each_keys(ctx, each_value_14, get_each_context_14, get_key);
    				each_blocks_7 = update_keyed_each(each_blocks_7, dirty, get_key, 1, ctx, each_value_14, each0_lookup, div0, destroy_block, create_each_block_14, null, get_each_context_14);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div0, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div0, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value_12 = Array(3);
    				validate_each_argument(each_value_12);
    				validate_each_keys(ctx, each_value_12, get_each_context_12, get_key_1);
    				each_blocks_6 = update_keyed_each(each_blocks_6, dirty, get_key_1, 1, ctx, each_value_12, each1_lookup, div1, destroy_block, create_each_block_12, null, get_each_context_12);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div1, "width", 3 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div1, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value_10 = Array(110);
    				validate_each_argument(each_value_10);
    				validate_each_keys(ctx, each_value_10, get_each_context_10, get_key_2);
    				each_blocks_5 = update_keyed_each(each_blocks_5, dirty, get_key_2, 1, ctx, each_value_10, each2_lookup, div2, destroy_block, create_each_block_10, null, get_each_context_10);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div2, "width", 110 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div2, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value_8 = Array(2);
    				validate_each_argument(each_value_8);
    				validate_each_keys(ctx, each_value_8, get_each_context_8, get_key_3);
    				each_blocks_4 = update_keyed_each(each_blocks_4, dirty, get_key_3, 1, ctx, each_value_8, each3_lookup, div3, destroy_block, create_each_block_8, null, get_each_context_8);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div3, "width", 2 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div3, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}

    			const canvasmatrix_changes = {};
    			if (dirty & /*pixelSize*/ 1) canvasmatrix_changes.pixelSize = /*pixelSize*/ ctx[0];
    			canvasmatrix.$set(canvasmatrix_changes);

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div4, "width", 106 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div4, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value_6 = Array(2);
    				validate_each_argument(each_value_6);
    				validate_each_keys(ctx, each_value_6, get_each_context_6, get_key_4);
    				each_blocks_3 = update_keyed_each(each_blocks_3, dirty, get_key_4, 1, ctx, each_value_6, each4_lookup, div5, destroy_block, create_each_block_6, null, get_each_context_6);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div5, "width", 2 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div5, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value_4 = Array(110);
    				validate_each_argument(each_value_4);
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key_5);
    				each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key_5, 1, ctx, each_value_4, each5_lookup, div6, destroy_block, create_each_block_4, null, get_each_context_4);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div6, "width", 110 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div6, "height", 2 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div7, "width", 110 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div7, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value_2 = Array(3);
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_6);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_6, 1, ctx, each_value_2, each6_lookup, div8, destroy_block, create_each_block_2, null, get_each_context_2);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div8, "width", 3 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div8, "height", 21 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (dirty & /*pixelSize, Array*/ 1) {
    				each_value = Array(116);
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key_7);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_7, 1, ctx, each_value, each7_lookup, div9, destroy_block, create_each_block, null, get_each_context);
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div9, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div9, "height", 3 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div10, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div10, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvasmatrix.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvasmatrix.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].d();
    			}

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].d();
    			}

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].d();
    			}

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].d();
    			}

    			destroy_component(canvasmatrix);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].d();
    			}

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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CanvasDecore', slots, []);
    	let { pixelSize } = $$props;
    	const writable_props = ['pixelSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CanvasDecore> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	$$self.$capture_state = () => ({ CanvasMatrix, pixelSize });

    	$$self.$inject_state = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pixelSize];
    }

    class CanvasDecore extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { pixelSize: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CanvasDecore",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pixelSize*/ ctx[0] === undefined && !('pixelSize' in props)) {
    			console.warn("<CanvasDecore> was created without expected prop 'pixelSize'");
    		}
    	}

    	get pixelSize() {
    		throw new Error("<CanvasDecore>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pixelSize(value) {
    		throw new Error("<CanvasDecore>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/demo/CanvasContainer.svelte generated by Svelte v3.48.0 */
    const file$3 = "src/demo/CanvasContainer.svelte";

    function create_fragment$4(ctx) {
    	let div21;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;
    	let canvasdecore;
    	let t4;
    	let div12;
    	let div5;
    	let t5;
    	let div6;
    	let t6;
    	let div11;
    	let div7;
    	let b0;
    	let t8;
    	let div10;
    	let div8;
    	let b1;
    	let i0;
    	let t10;
    	let div9;
    	let b2;
    	let i1;
    	let t12;
    	let div20;
    	let div13;
    	let t13;
    	let div14;
    	let t14;
    	let div19;
    	let div15;
    	let b3;
    	let t16;
    	let div18;
    	let div16;
    	let b4;
    	let i2;
    	let t18;
    	let div17;
    	let b5;
    	let i3;
    	let current;

    	canvasdecore = new CanvasDecore({
    			props: { pixelSize: /*pixelSize*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div21 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			create_component(canvasdecore.$$.fragment);
    			t4 = space();
    			div12 = element("div");
    			div5 = element("div");
    			t5 = space();
    			div6 = element("div");
    			t6 = space();
    			div11 = element("div");
    			div7 = element("div");
    			b0 = element("b");
    			b0.textContent = "Y";
    			t8 = space();
    			div10 = element("div");
    			div8 = element("div");
    			b1 = element("b");
    			i0 = element("i");
    			i0.textContent = "k";
    			t10 = space();
    			div9 = element("div");
    			b2 = element("b");
    			i1 = element("i");
    			i1.textContent = "k+17";
    			t12 = space();
    			div20 = element("div");
    			div13 = element("div");
    			t13 = space();
    			div14 = element("div");
    			t14 = space();
    			div19 = element("div");
    			div15 = element("div");
    			b3 = element("b");
    			b3.textContent = "X";
    			t16 = space();
    			div18 = element("div");
    			div16 = element("div");
    			b4 = element("b");
    			i2 = element("i");
    			i2.textContent = "0";
    			t18 = space();
    			div17 = element("div");
    			b5 = element("b");
    			i3 = element("i");
    			i3.textContent = "106";
    			attr_dev(div0, "class", "container-top-gradient svelte-o20noi");
    			set_style(div0, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div0, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div0, file$3, 7, 4, 281);
    			attr_dev(div1, "class", "container-left-gradient svelte-o20noi");
    			set_style(div1, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div1, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div1, file$3, 8, 4, 390);
    			attr_dev(div2, "class", "container-right-gradient svelte-o20noi");
    			set_style(div2, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div2, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div2, file$3, 9, 4, 499);
    			attr_dev(div3, "class", "container-bot-gradient svelte-o20noi");
    			set_style(div3, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div3, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div3, file$3, 10, 4, 609);
    			attr_dev(div4, "class", "decore-container svelte-o20noi");
    			set_style(div4, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div4, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div4, file$3, 12, 4, 719);
    			attr_dev(div5, "class", "container-axis-y-arrow-body svelte-o20noi");
    			add_location(div5, file$3, 18, 8, 1061);
    			attr_dev(div6, "class", "container-axis-y-arrow-head svelte-o20noi");
    			set_style(div6, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div6, "height", /*pixelSize*/ ctx[0] + "px");
    			set_style(div6, "top", /*pixelSize*/ ctx[0] / 5 + "px");
    			add_location(div6, file$3, 19, 2, 1111);
    			add_location(b0, file$3, 21, 145, 1491);
    			attr_dev(div7, "class", "container-axis-y-arrow-rest-name svelte-o20noi");
    			set_style(div7, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			set_style(div7, "right", /*pixelSize*/ ctx[0] * -1.5 + "px");
    			set_style(div7, "top", /*pixelSize*/ ctx[0] + "px");
    			add_location(div7, file$3, 21, 12, 1358);
    			add_location(i0, file$3, 23, 162, 1789);
    			add_location(b1, file$3, 23, 159, 1786);
    			attr_dev(div8, "class", "container-axis-y-arrow-rest-dash-first svelte-o20noi");
    			set_style(div8, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			set_style(div8, "right", /*pixelSize*/ ctx[0] / 2 + "px");
    			set_style(div8, "bottom", /*pixelSize*/ ctx[0] / 5 + "px");
    			add_location(div8, file$3, 23, 16, 1643);
    			add_location(i1, file$3, 24, 159, 1967);
    			add_location(b2, file$3, 24, 156, 1964);
    			attr_dev(div9, "class", "container-axis-y-arrow-rest-dash-last svelte-o20noi");
    			set_style(div9, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			set_style(div9, "right", /*pixelSize*/ ctx[0] / 2 + "px");
    			set_style(div9, "top", /*pixelSize*/ ctx[0] * -1 + "px");
    			add_location(div9, file$3, 24, 16, 1824);
    			attr_dev(div10, "class", "container-axis-y-arrow-rest-dash svelte-o20noi");
    			set_style(div10, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div10, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div10, file$3, 22, 12, 1519);
    			attr_dev(div11, "class", "container-axis-y-arrow-rest svelte-o20noi");
    			set_style(div11, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div11, "height", 22 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div11, file$3, 20, 8, 1243);
    			attr_dev(div12, "class", "container-axis-y svelte-o20noi");
    			set_style(div12, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div12, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div12, file$3, 17, 4, 961);
    			attr_dev(div13, "class", "container-axis-x-arrow-body svelte-o20noi");
    			add_location(div13, file$3, 31, 8, 2222);
    			attr_dev(div14, "class", "container-axis-x-arrow-head svelte-o20noi");
    			set_style(div14, "width", /*pixelSize*/ ctx[0] + "px");
    			set_style(div14, "height", /*pixelSize*/ ctx[0] + "px");
    			set_style(div14, "right", /*pixelSize*/ ctx[0] / 5 + "px");
    			add_location(div14, file$3, 32, 8, 2279);
    			add_location(b3, file$3, 34, 149, 2666);
    			attr_dev(div15, "class", "container-axis-x-arrow-rest-name svelte-o20noi");
    			set_style(div15, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			set_style(div15, "right", /*pixelSize*/ ctx[0] * 1.3 + "px");
    			set_style(div15, "top", /*pixelSize*/ ctx[0] * -2 + "px");
    			add_location(div15, file$3, 34, 12, 2529);
    			add_location(i2, file$3, 36, 134, 2937);
    			add_location(b4, file$3, 36, 131, 2934);
    			attr_dev(div16, "class", "container-axis-x-arrow-rest-dash-first svelte-o20noi");
    			set_style(div16, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			set_style(div16, "left", /*pixelSize*/ ctx[0] / 5 + "px");
    			add_location(div16, file$3, 36, 16, 2819);
    			add_location(i3, file$3, 37, 135, 3091);
    			add_location(b5, file$3, 37, 132, 3088);
    			attr_dev(div17, "class", "container-axis-x-arrow-rest-dash-last svelte-o20noi");
    			set_style(div17, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			set_style(div17, "right", /*pixelSize*/ ctx[0] * -1 + "px");
    			add_location(div17, file$3, 37, 16, 2972);
    			attr_dev(div18, "class", "container-axis-x-arrow-rest-dash svelte-o20noi");
    			set_style(div18, "width", 106 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div18, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div18, file$3, 35, 12, 2694);
    			attr_dev(div19, "class", "container-axis-x-arrow-rest svelte-o20noi");
    			set_style(div19, "width", 111 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div19, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div19, file$3, 33, 8, 2413);
    			attr_dev(div20, "class", "container-axis-x svelte-o20noi");
    			set_style(div20, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div20, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div20, file$3, 30, 4, 2121);
    			attr_dev(div21, "class", "container svelte-o20noi");
    			set_style(div21, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div21, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div21, file$3, 6, 0, 190);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div0);
    			append_dev(div21, t0);
    			append_dev(div21, div1);
    			append_dev(div21, t1);
    			append_dev(div21, div2);
    			append_dev(div21, t2);
    			append_dev(div21, div3);
    			append_dev(div21, t3);
    			append_dev(div21, div4);
    			mount_component(canvasdecore, div4, null);
    			append_dev(div21, t4);
    			append_dev(div21, div12);
    			append_dev(div12, div5);
    			append_dev(div12, t5);
    			append_dev(div12, div6);
    			append_dev(div12, t6);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			append_dev(div7, b0);
    			append_dev(div11, t8);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, b1);
    			append_dev(b1, i0);
    			append_dev(div10, t10);
    			append_dev(div10, div9);
    			append_dev(div9, b2);
    			append_dev(b2, i1);
    			append_dev(div21, t12);
    			append_dev(div21, div20);
    			append_dev(div20, div13);
    			append_dev(div20, t13);
    			append_dev(div20, div14);
    			append_dev(div20, t14);
    			append_dev(div20, div19);
    			append_dev(div19, div15);
    			append_dev(div15, b3);
    			append_dev(div19, t16);
    			append_dev(div19, div18);
    			append_dev(div18, div16);
    			append_dev(div16, b4);
    			append_dev(b4, i2);
    			append_dev(div18, t18);
    			append_dev(div18, div17);
    			append_dev(div17, b5);
    			append_dev(b5, i3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div0, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div0, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div1, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div1, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div2, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div2, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div3, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div3, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			const canvasdecore_changes = {};
    			if (dirty & /*pixelSize*/ 1) canvasdecore_changes.pixelSize = /*pixelSize*/ ctx[0];
    			canvasdecore.$set(canvasdecore_changes);

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div4, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div4, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div6, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div6, "height", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div6, "top", /*pixelSize*/ ctx[0] / 5 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div7, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div7, "right", /*pixelSize*/ ctx[0] * -1.5 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div7, "top", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div8, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div8, "right", /*pixelSize*/ ctx[0] / 2 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div8, "bottom", /*pixelSize*/ ctx[0] / 5 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div9, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div9, "right", /*pixelSize*/ ctx[0] / 2 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div9, "top", /*pixelSize*/ ctx[0] * -1 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div10, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div10, "height", 17 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div11, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div11, "height", 22 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div12, "width", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div12, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div14, "width", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div14, "height", /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div14, "right", /*pixelSize*/ ctx[0] / 5 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div15, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div15, "right", /*pixelSize*/ ctx[0] * 1.3 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div15, "top", /*pixelSize*/ ctx[0] * -2 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div16, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div16, "left", /*pixelSize*/ ctx[0] / 5 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div17, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div17, "right", /*pixelSize*/ ctx[0] * -1 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div18, "width", 106 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div18, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div19, "width", 111 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div19, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div20, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div20, "height", 5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div21, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div21, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvasdecore.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvasdecore.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div21);
    			destroy_component(canvasdecore);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CanvasContainer', slots, []);
    	let { pixelSize } = $$props;
    	const writable_props = ['pixelSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CanvasContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	$$self.$capture_state = () => ({ CanvasDecore, pixelSize });

    	$$self.$inject_state = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pixelSize];
    }

    class CanvasContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { pixelSize: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CanvasContainer",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pixelSize*/ ctx[0] === undefined && !('pixelSize' in props)) {
    			console.warn("<CanvasContainer> was created without expected prop 'pixelSize'");
    		}
    	}

    	get pixelSize() {
    		throw new Error("<CanvasContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pixelSize(value) {
    		throw new Error("<CanvasContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/demo/CanvasButtons.svelte generated by Svelte v3.48.0 */
    const file$2 = "src/demo/CanvasButtons.svelte";

    function create_fragment$3(ctx) {
    	let div5;
    	let div0;
    	let canvascontainer;
    	let t0;
    	let div4;
    	let div1;
    	let button0;
    	let i;
    	let t1;
    	let sub;
    	let t3;
    	let textarea;
    	let t4;
    	let div3;
    	let button1;
    	let t5;
    	let t6;
    	let button2;
    	let t7;
    	let t8;
    	let button3;
    	let t9;
    	let t10;
    	let div2;
    	let button4;
    	let t11;
    	let button5;
    	let t12;
    	let button6;
    	let current;

    	canvascontainer = new CanvasContainer({
    			props: { pixelSize: /*pixelSize*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			create_component(canvascontainer.$$.fragment);
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			button0 = element("button");
    			i = element("i");
    			t1 = text("k");
    			sub = element("sub");
    			sub.textContent = "dec";
    			t3 = space();
    			textarea = element("textarea");
    			t4 = space();
    			div3 = element("div");
    			button1 = element("button");
    			t5 = text("Comment");
    			t6 = space();
    			button2 = element("button");
    			t7 = text("Paste");
    			t8 = space();
    			button3 = element("button");
    			t9 = text("Copy");
    			t10 = space();
    			div2 = element("div");
    			button4 = element("button");
    			t11 = space();
    			button5 = element("button");
    			t12 = space();
    			button6 = element("button");
    			attr_dev(div0, "class", "container-container svelte-10d17w0");
    			set_style(div0, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div0, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div0, file$2, 8, 4, 880);
    			add_location(sub, file$2, 13, 134, 1369);
    			add_location(i, file$2, 13, 130, 1365);
    			attr_dev(button0, "type", "button");
    			set_style(button0, "font-size", 2 * /*pixelSize*/ ctx[0] - 4 + "px");
    			set_style(button0, "width", 8 * /*pixelSize*/ ctx[0] + "px");
    			set_style(button0, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			attr_dev(button0, "class", "svelte-10d17w0");
    			add_location(button0, file$2, 13, 12, 1247);
    			set_style(textarea, "line-height", 2.5 * /*pixelSize*/ ctx[0] - 1 + "px");
    			set_style(textarea, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			set_style(textarea, "width", 88 * /*pixelSize*/ ctx[0] + "px");
    			set_style(textarea, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			textarea.value = kValue;
    			attr_dev(textarea, "class", "svelte-10d17w0");
    			add_location(textarea, file$2, 14, 12, 1409);
    			attr_dev(div1, "class", "k-buttons-value svelte-10d17w0");
    			set_style(div1, "width", 96 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div1, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div1, file$2, 12, 8, 1141);
    			attr_dev(button1, "class", "k-buttons-action-comment svelte-10d17w0");
    			attr_dev(button1, "type", "button");
    			set_style(button1, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			set_style(button1, "width", 12 * /*pixelSize*/ ctx[0] + "px");
    			set_style(button1, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(button1, file$2, 18, 12, 1768);
    			attr_dev(button2, "class", "k-buttons-action-paste svelte-10d17w0");
    			attr_dev(button2, "type", "button");
    			set_style(button2, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			set_style(button2, "width", 12 * /*pixelSize*/ ctx[0] + "px");
    			set_style(button2, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(button2, file$2, 19, 12, 1959);
    			attr_dev(button3, "class", "k-buttons-action-copy svelte-10d17w0");
    			attr_dev(button3, "type", "button");
    			set_style(button3, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			set_style(button3, "width", 12 * /*pixelSize*/ ctx[0] + "px");
    			set_style(button3, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(button3, file$2, 20, 12, 2136);
    			attr_dev(button4, "class", "k-buttons-action-tools-brush svelte-10d17w0");
    			attr_dev(button4, "type", "button");
    			set_style(button4, "width", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(button4, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(button4, file$2, 22, 16, 2427);
    			attr_dev(button5, "class", "k-buttons-action-tools-eraser svelte-10d17w0");
    			attr_dev(button5, "type", "button");
    			set_style(button5, "width", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(button5, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(button5, file$2, 23, 16, 2576);
    			attr_dev(button6, "class", "k-buttons-action-tools-options svelte-10d17w0");
    			attr_dev(button6, "type", "button");
    			set_style(button6, "width", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			set_style(button6, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(button6, file$2, 24, 16, 2726);
    			attr_dev(div2, "class", "k-buttons-action-tools svelte-10d17w0");
    			set_style(div2, "width", 48 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div2, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div2, file$2, 21, 12, 2311);
    			attr_dev(div3, "class", "k-buttons-action svelte-10d17w0");
    			set_style(div3, "width", 96 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div3, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div3, file$2, 16, 9, 1598);
    			attr_dev(div4, "class", "k-buttons svelte-10d17w0");
    			set_style(div4, "width", 96 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div4, "height", 6 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div4, file$2, 11, 4, 1048);
    			attr_dev(div5, "class", "buttons svelte-10d17w0");
    			set_style(div5, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div5, "height", 33 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div5, "padding-top", /*pixelSize*/ ctx[0] + "px");
    			add_location(div5, file$2, 7, 0, 763);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			mount_component(canvascontainer, div0, null);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, button0);
    			append_dev(button0, i);
    			append_dev(i, t1);
    			append_dev(i, sub);
    			append_dev(div1, t3);
    			append_dev(div1, textarea);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, button1);
    			append_dev(button1, t5);
    			append_dev(div3, t6);
    			append_dev(div3, button2);
    			append_dev(button2, t7);
    			append_dev(div3, t8);
    			append_dev(div3, button3);
    			append_dev(button3, t9);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, button4);
    			append_dev(div2, t11);
    			append_dev(div2, button5);
    			append_dev(div2, t12);
    			append_dev(div2, button6);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const canvascontainer_changes = {};
    			if (dirty & /*pixelSize*/ 1) canvascontainer_changes.pixelSize = /*pixelSize*/ ctx[0];
    			canvascontainer.$set(canvascontainer_changes);

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div0, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div0, "height", 27 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button0, "font-size", 2 * /*pixelSize*/ ctx[0] - 4 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button0, "width", 8 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button0, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(textarea, "line-height", 2.5 * /*pixelSize*/ ctx[0] - 1 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(textarea, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(textarea, "width", 88 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(textarea, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div1, "width", 96 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div1, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button1, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button1, "width", 12 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button1, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button2, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button2, "width", 12 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button2, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button3, "font-size", 2 * /*pixelSize*/ ctx[0] - 6 + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button3, "width", 12 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button3, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button4, "width", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button4, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button5, "width", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button5, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button6, "width", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(button6, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div2, "width", 48 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div2, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div3, "width", 96 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div3, "height", 2.5 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div4, "width", 96 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div4, "height", 6 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div5, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div5, "height", 33 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div5, "padding-top", /*pixelSize*/ ctx[0] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvascontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvascontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(canvascontainer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const kValue = '4858487703217654168507377107565676789145697178497253677539145555247620343537955749299116772611982962556356527603203744742682135448820545638134012705381689785851604674225344958377377969928942335793703373498110479735981161931616997837568312568489938311294622859986621379234205529965392091893253288500432782862263410646820171439206408889517627953930924005233285455643232746873900205120036557171717499335122490912065694632935352302178602108137941774883061885522205403967593003199773578952627785152838963495027790689532144351329310799436758088941551';

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CanvasButtons', slots, []);
    	let { pixelSize } = $$props;
    	const writable_props = ['pixelSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CanvasButtons> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	$$self.$capture_state = () => ({ CanvasContainer, pixelSize, kValue });

    	$$self.$inject_state = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pixelSize];
    }

    class CanvasButtons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { pixelSize: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CanvasButtons",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pixelSize*/ ctx[0] === undefined && !('pixelSize' in props)) {
    			console.warn("<CanvasButtons> was created without expected prop 'pixelSize'");
    		}
    	}

    	get pixelSize() {
    		throw new Error("<CanvasButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pixelSize(value) {
    		throw new Error("<CanvasButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/demo/CanvasBlanket.svelte generated by Svelte v3.48.0 */
    const file$1 = "src/demo/CanvasBlanket.svelte";

    // (57:0) {#if loaderDisplay}
    function create_if_block(ctx) {
    	let div17;
    	let div16;
    	let h1;
    	let t1;
    	let div0;
    	let t2;
    	let div1;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let t5;
    	let div4;
    	let t6;
    	let div5;
    	let t7;
    	let div6;
    	let t8;
    	let div7;
    	let t9;
    	let div8;
    	let t10;
    	let div9;
    	let t11;
    	let div10;
    	let t12;
    	let div11;
    	let t13;
    	let div12;
    	let t14;
    	let div13;
    	let t15;
    	let div14;
    	let t16;
    	let div15;

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			div16 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Loading...";
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			div5 = element("div");
    			t7 = space();
    			div6 = element("div");
    			t8 = space();
    			div7 = element("div");
    			t9 = space();
    			div8 = element("div");
    			t10 = space();
    			div9 = element("div");
    			t11 = space();
    			div10 = element("div");
    			t12 = space();
    			div11 = element("div");
    			t13 = space();
    			div12 = element("div");
    			t14 = space();
    			div13 = element("div");
    			t15 = space();
    			div14 = element("div");
    			t16 = space();
    			div15 = element("div");
    			attr_dev(h1, "class", "blanket-loading-text svelte-298ez0");
    			add_location(h1, file$1, 59, 12, 2000);
    			attr_dev(div0, "class", "cell d-0 svelte-298ez0");
    			add_location(div0, file$1, 61, 12, 2062);
    			attr_dev(div1, "class", "cell d-1 svelte-298ez0");
    			add_location(div1, file$1, 62, 12, 2103);
    			attr_dev(div2, "class", "cell d-2 svelte-298ez0");
    			add_location(div2, file$1, 63, 12, 2144);
    			attr_dev(div3, "class", "cell d-3 svelte-298ez0");
    			add_location(div3, file$1, 64, 12, 2185);
    			attr_dev(div4, "class", "cell d-1 svelte-298ez0");
    			add_location(div4, file$1, 65, 12, 2226);
    			attr_dev(div5, "class", "cell d-2 svelte-298ez0");
    			add_location(div5, file$1, 66, 12, 2267);
    			attr_dev(div6, "class", "cell d-3 svelte-298ez0");
    			add_location(div6, file$1, 67, 12, 2308);
    			attr_dev(div7, "class", "cell d-4 svelte-298ez0");
    			add_location(div7, file$1, 68, 12, 2349);
    			attr_dev(div8, "class", "cell d-2 svelte-298ez0");
    			add_location(div8, file$1, 69, 12, 2390);
    			attr_dev(div9, "class", "cell d-3 svelte-298ez0");
    			add_location(div9, file$1, 70, 12, 2431);
    			attr_dev(div10, "class", "cell d-4 svelte-298ez0");
    			add_location(div10, file$1, 71, 12, 2472);
    			attr_dev(div11, "class", "cell d-5 svelte-298ez0");
    			add_location(div11, file$1, 72, 12, 2513);
    			attr_dev(div12, "class", "cell d-3 svelte-298ez0");
    			add_location(div12, file$1, 73, 12, 2554);
    			attr_dev(div13, "class", "cell d-4 svelte-298ez0");
    			add_location(div13, file$1, 74, 12, 2595);
    			attr_dev(div14, "class", "cell d-5 svelte-298ez0");
    			add_location(div14, file$1, 75, 12, 2636);
    			attr_dev(div15, "class", "cell d-6 svelte-298ez0");
    			add_location(div15, file$1, 76, 12, 2677);
    			attr_dev(div16, "class", "blanket-loading-mosaic svelte-298ez0");
    			set_style(div16, "--cell-size", 64 * (/*pixelSize*/ ctx[0] / 10) + "px");
    			add_location(div16, file$1, 58, 8, 1904);
    			attr_dev(div17, "class", "blanket-loading svelte-298ez0");
    			add_location(div17, file$1, 57, 4, 1866);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div16);
    			append_dev(div16, h1);
    			append_dev(div16, t1);
    			append_dev(div16, div0);
    			append_dev(div16, t2);
    			append_dev(div16, div1);
    			append_dev(div16, t3);
    			append_dev(div16, div2);
    			append_dev(div16, t4);
    			append_dev(div16, div3);
    			append_dev(div16, t5);
    			append_dev(div16, div4);
    			append_dev(div16, t6);
    			append_dev(div16, div5);
    			append_dev(div16, t7);
    			append_dev(div16, div6);
    			append_dev(div16, t8);
    			append_dev(div16, div7);
    			append_dev(div16, t9);
    			append_dev(div16, div8);
    			append_dev(div16, t10);
    			append_dev(div16, div9);
    			append_dev(div16, t11);
    			append_dev(div16, div10);
    			append_dev(div16, t12);
    			append_dev(div16, div11);
    			append_dev(div16, t13);
    			append_dev(div16, div12);
    			append_dev(div16, t14);
    			append_dev(div16, div13);
    			append_dev(div16, t15);
    			append_dev(div16, div14);
    			append_dev(div16, t16);
    			append_dev(div16, div15);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pixelSize*/ 1) {
    				set_style(div16, "--cell-size", 64 * (/*pixelSize*/ ctx[0] / 10) + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(57:0) {#if loaderDisplay}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let canvasbuttons;
    	let t0;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let if_block_anchor;
    	let current;

    	canvasbuttons = new CanvasButtons({
    			props: { pixelSize: /*pixelSize*/ ctx[0] },
    			$$inline: true
    		});

    	let if_block = /*loaderDisplay*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(canvasbuttons.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(/*windowWidth*/ ctx[1]);
    			t2 = space();
    			t3 = text(/*windowHeight*/ ctx[2]);
    			t4 = space();
    			t5 = text(/*pixelSize*/ ctx[0]);
    			t6 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h1, "class", "butons-container-debug svelte-298ez0");
    			set_style(h1, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			add_location(h1, file$1, 53, 4, 1715);
    			attr_dev(div, "class", "butons-container svelte-298ez0");
    			set_style(div, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			set_style(div, "height", 34 * /*pixelSize*/ ctx[0] + "px");
    			add_location(div, file$1, 51, 0, 1569);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(canvasbuttons, div, null);
    			append_dev(div, t0);
    			append_dev(div, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(h1, t4);
    			append_dev(h1, t5);
    			insert_dev(target, t6, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const canvasbuttons_changes = {};
    			if (dirty & /*pixelSize*/ 1) canvasbuttons_changes.pixelSize = /*pixelSize*/ ctx[0];
    			canvasbuttons.$set(canvasbuttons_changes);
    			if (!current || dirty & /*windowWidth*/ 2) set_data_dev(t1, /*windowWidth*/ ctx[1]);
    			if (!current || dirty & /*windowHeight*/ 4) set_data_dev(t3, /*windowHeight*/ ctx[2]);
    			if (!current || dirty & /*pixelSize*/ 1) set_data_dev(t5, /*pixelSize*/ ctx[0]);

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(h1, "font-size", /*pixelSize*/ ctx[0] / 10 + "em");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div, "width", 116 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*pixelSize*/ 1) {
    				set_style(div, "height", 34 * /*pixelSize*/ ctx[0] + "px");
    			}

    			if (/*loaderDisplay*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvasbuttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvasbuttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(canvasbuttons);
    			if (detaching) detach_dev(t6);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CanvasBlanket', slots, []);
    	let pixelSize = 0;
    	let tempPWidth = 0;
    	let tempPHeight = 0;
    	let windowWidth = 0;
    	let windowHeight = 0;
    	let loaderDisplay = false;

    	const setPixelSize = () => {
    		/* display loader */
    		$$invalidate(3, loaderDisplay = true);

    		/* get client screen size */
    		$$invalidate(1, windowWidth = window.innerWidth);

    		$$invalidate(2, windowHeight = window.innerHeight);

    		if (windowWidth > windowHeight) {
    			tempPHeight = Math.floor(windowHeight / 34);
    			tempPWidth = Math.floor(windowWidth / 116);
    		} else if (windowWidth < windowHeight) {
    			tempPHeight = Math.floor(windowHeight / 116);
    			tempPWidth = Math.floor(windowWidth / 34);
    		} else {
    			tempPHeight = Math.floor(windowHeight / 34);
    			tempPWidth = Math.floor(windowWidth / 116);
    		}

    		/* check for the boundaries and the balance of Height vs Width */
    		$$invalidate(0, pixelSize = tempPWidth > tempPHeight ? tempPHeight : tempPWidth);

    		$$invalidate(0, pixelSize = pixelSize <= 10 ? pixelSize : 10);
    		$$invalidate(0, pixelSize = pixelSize >= 4 ? pixelSize : 4);

    		/* remove display loader (serves no purpose other than being pretty) */
    		setTimeout(
    			() => {
    				$$invalidate(3, loaderDisplay = false);
    			},
    			Math.random() * 1200 | 600
    		);
    	};

    	onMount(() => {
    		window.addEventListener('resize', setPixelSize);

    		return () => {
    			window.removeEventListener('resize', setPixelSize);
    		};
    	});

    	/* run once on page load */
    	setPixelSize();

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CanvasBlanket> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		CanvasButtons,
    		onMount,
    		pixelSize,
    		tempPWidth,
    		tempPHeight,
    		windowWidth,
    		windowHeight,
    		loaderDisplay,
    		setPixelSize
    	});

    	$$self.$inject_state = $$props => {
    		if ('pixelSize' in $$props) $$invalidate(0, pixelSize = $$props.pixelSize);
    		if ('tempPWidth' in $$props) tempPWidth = $$props.tempPWidth;
    		if ('tempPHeight' in $$props) tempPHeight = $$props.tempPHeight;
    		if ('windowWidth' in $$props) $$invalidate(1, windowWidth = $$props.windowWidth);
    		if ('windowHeight' in $$props) $$invalidate(2, windowHeight = $$props.windowHeight);
    		if ('loaderDisplay' in $$props) $$invalidate(3, loaderDisplay = $$props.loaderDisplay);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pixelSize, windowWidth, windowHeight, loaderDisplay];
    }

    class CanvasBlanket extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CanvasBlanket",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Demo.svelte generated by Svelte v3.48.0 */
    const file = "src/Demo.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let graph;
    	let current;
    	graph = new CanvasBlanket({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(graph.$$.fragment);
    			attr_dev(div, "class", "graph-container svelte-12i22bv");
    			add_location(div, file, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(graph, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graph.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graph.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(graph);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Demo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Demo> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Graph: CanvasBlanket });
    	return [];
    }

    class Demo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Demo",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */

    function create_fragment(ctx) {
    	let demo;
    	let current;
    	demo = new Demo({ $$inline: true });

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

    	$$self.$capture_state = () => ({ Demo });
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
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
