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
  target: null,
  rootMargin: '10px 0px 10px 0px'
}

const DefaultType = {
  target: '(string|element)',
  rootMargin: '(string)'
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

    // this._element is  the observablesContainer
    this._config = this._getConfig(config)
    this._targetsContainer = this._config.target

    if (!isElement(this._targetsContainer)) {
      throw new TypeError('Bootstrap\'s tooltips require Popper (https://popper.js.org)')
      // this.dispose()
      // return
    }

    this._targets = []
    this._activeTarget = null
    this._observableSections = []
    this._observer = null
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
    // `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}, .${CLASS_NAME_DROPDOWN_ITEM}`
    this._targets = SelectorEngine
      .find('[href]', this._targetsContainer)
      .filter(el => el.hash.length > 0)// ensure that all have id

    this._observableSections = this._targets
      .map(el => SelectorEngine.findOne(el.hash, this._element))
      .filter(el => el)// filter nulls

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
    if (!target || this._activeTarget === target) {
      return
    }

    this._activeTarget = target
    this._clearActiveClass()

    target.classList.add(CLASS_NAME_ACTIVE)

    if (target.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) { // Activate dropdown parents
      SelectorEngine.findOne(SELECTOR_DROPDOWN_TOGGLE, target.closest(SELECTOR_DROPDOWN))
        .classList.add(CLASS_NAME_ACTIVE)
    } else {
      SelectorEngine.parents(target, SELECTOR_NAV_LIST_GROUP)
        .forEach(listGroup => {
          // Set triggered links parents as active
          // With both <ul> and <nav> markup a parent is the previous sibling of any nav ancestor
          SelectorEngine.prev(listGroup, `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`)
            .forEach(item => item.classList.add(CLASS_NAME_ACTIVE))

          // Handle special case when .nav-link is inside .nav-item
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

  _clearActiveClass() {
    SelectorEngine.find(`.${CLASS_NAME_ACTIVE}`, this._targetsContainer)
      .forEach(node => node.classList.remove(CLASS_NAME_ACTIVE))
  }

  _getNewObserver() {
    const callback = entries => {
      const entry = entries
        .filter(el => el.isIntersecting)
        .sort((a, b) => (a.intersectionRect.height - b.intersectionRect.height))
        .pop()
      // eslint-disable-next-line no-console
      console.log(entries, entry)
      if (entry) {
        this._activate(this._targets.find(el => el.hash === `#${entry.target.id}`))
      }
    }

    const options = {
      root: this._element,
      threshold: 0,
      rootMargin: this._config.rootMargin
    }

    return new IntersectionObserver(callback.bind(this), options)
  }

  // Static

  static jQueryInterface(config) {
    return this.each(function () {
      const data = ScrollSpy.getInstance(this) || new ScrollSpy(this, config)

      if (typeof config !== 'string') {
        return
      }

      if (data[config] === undefined || config.startsWith('_') || config === 'constructor') {
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
