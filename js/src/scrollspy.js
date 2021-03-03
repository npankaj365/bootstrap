/**
 * --------------------------------------------------------------------------
 * Bootstrap (v5.0.0-beta2): scrollspy.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 */

import { defineJQueryPlugin, isElement, typeCheckConfig } from './util/index'
import EventHandler from './dom/event-handler'
import Manipulator from './dom/manipulator'
import SelectorEngine from './dom/selector-engine'
import BaseComponent from './base-component'

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

const NAME = 'scrollspy'
const DATA_KEY = 'bs.scrollspy'
const EVENT_KEY = `.${DATA_KEY}`
const DATA_API_KEY = '.data-api'

const Default = {
  offset: 10,
  target: ''
}

const DefaultType = {
  offset: 'number',
  target: '(string|element)'
}

const EVENT_ACTIVATE = `activate${EVENT_KEY}`
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}${DATA_API_KEY}`

const CLASS_NAME_DROPDOWN_ITEM = 'dropdown-item'
const CLASS_NAME_ACTIVE = 'active'

const SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]'
const SELECTOR_NAV_LIST_GROUP = '.nav, .list-group'
const SELECTOR_NAV_LINKS = '.nav-link'
const SELECTOR_LIST_ITEMS = '.list-group-item'
const SELECTOR_DROPDOWN = '.dropdown'
const SELECTOR_DROPDOWN_TOGGLE = '.dropdown-toggle'

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

class ScrollSpy extends BaseComponent {
  constructor(element, config) {
    super(element)
    this._config = this._getConfig(config)
    this._targetsContainer = this._config.target
    this.refresh() // initialize
  }

  // Getters

  static get Default() {
    return Default
  }

  static get DATA_KEY() {
    return DATA_KEY
  }

  // Public

  refresh() {
    this._targets = SelectorEngine
      .find(`${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}, .${CLASS_NAME_DROPDOWN_ITEM}`, this._targetsContainer)
      .filter(el => el.hash.length > 0)

    this._activate(this._targets.shift())// activate first target
    this._observableSections = this._targets.map(el => SelectorEngine.findOne(el.hash, this._element))

    if (this._observer) {
      this._observer.disconnect()
    } else {
      this._observer = this._getNewObserver()
    }

    this._observableSections.forEach(section => this._observer.observe(section))
  }

  dispose() {
    super.dispose()

    this._config = null
    this._targetsContainer = null
    this._targets = []
    this._activeTarget = null
    this._observableSections = []
    this._observer.disconnect()
    this._observer = null
  }

  // Private

  _getConfig(config) {
    config = {
      ...Default,
      ...Manipulator.getDataAttributes(this._element),
      ...(typeof config === 'object' && config ? config : {})
    }

    if (!isElement(config.target)) {
      config.target = SelectorEngine.findOne(config.target)
    }

    // if (!config.target.id) {
    //   config.target.id = getUID(NAME)
    // }

    typeCheckConfig(NAME, config, DefaultType)

    return config
  }

  _activate(target) {
    if (this._activeTarget === target) {
      return
    }

    this._activeTarget = target
    this._clear()

    target.classList.add(CLASS_NAME_ACTIVE)

    if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
      SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE, target.closest(SELECTOR_DROPDOWN))
        .classList.add(CLASS_NAME_ACTIVE)
    } else {
      SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)
        .forEach(listGroup => {
          // Set triggered links parents as active
          // With both <ul> and <nav> markup a parent is the previous sibling of any nav ancestor
          SelectorEngine.prev(listGroup, `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`)
            .forEach(item => item.classList.add(CLASS_NAME_ACTIVE))

          // // Handle special case when .nav-link is inside .nav-item
          // SelectorEngine.prev(listGroup, SELECTOR_NAV_ITEMS)
          //   .forEach(navItem => {
          //     SelectorEngine.children(navItem, SELECTOR_NAV_LINKS)
          //       .forEach(item => item.classList.add(CLASS_NAME_ACTIVE))
          //   })
        })
    }

    EventHandler.trigger(this._element, EVENT_ACTIVATE, {
      relatedTarget: target
    })
  }

  _clear() {
    SelectorEngine.find(`.${CLASS_NAME_ACTIVE}`, this._targetsContainer)
      .forEach(node => node.classList.remove(CLASS_NAME_ACTIVE))
  }

  _getNewObserver() {
    return new IntersectionObserver(entries => {
      const entry = entries.find(entry => entry.intersectionRatio)
      // const entry = entries
      //   .filter(el => el.isIntersecting)
      //   .sort((a, b) => (a.intersectionRect.top - b.intersectionRect.top))
      //   .shift()
      // entries.forEach(b => console.log(b.intersectionRatio))
      if (entry) {
        this._activate(this._targets.find(el => el.hash === `#${entry.target.id}`))
      }
    }, {
      root: this._element,
      rootMargin: '0px',
      threshold: 0
    })
  }

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      const data = ScrollSpy.getInstance(this) || new ScrollSpy(this, config)

      if (typeof config !== 'string') {
        return
      }

      if (typeof data[config] === 'undefined') {
        throw new TypeError(`No method named "${config}"`)
      }

      data[config]()
    })
  }
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
  SelectorEngine.find(SELECTOR_DATA_SPY)
    .forEach(spy => new ScrollSpy(spy))
})

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 * add .ScrollSpy to jQuery only if jQuery is present
 */

defineJQueryPlugin(NAME, ScrollSpy)

export default ScrollSpy
