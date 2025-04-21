import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import supabase from "../supabase";
import { Link } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', link: '/', current: false },
  {
    name: 'Data',
    current: false,
    submenu: [
      { name: 'Customer', link: '/customer' },
      { name: 'Product', link: '/Product' },
      { name: 'Sample', link: '/Sample' },
      { name: 'Bank Account', link: '/bank' },
      { name: 'Company', link: '/company' },
    ],
  },
  {
    name: 'Work',
    current: false,
    submenu: [
      { name: 'Order', link: '/order', current: false },
      { name: 'Prospect', link: '/Prospect',current: false },
      { name: 'Exhibition', link: '/Exhibition' },
      { name: 'Payments', link: '/payments' },
    ],
  },
  { name: 'Batch', link: '/batches', current: false },
  
  // { name: 'Shipment', link: '/shipment', current: false },
  {
    name: 'Report',
    current: false,
    submenu: [
      { name: 'Production Capacity', link: '/report-production' },
      { name: 'Total Sales', link: '/report-sales' },
      { name: 'Top Customer', link: '/report-top-customer' },
    ],
  },
  {
    name: 'Tools',
    current: false,
    submenu: [
      { name: 'AI Assistant', link: '/ai-assistant' },
      { name: 'Setting WhatsApp', link: '/whatsapp-setting' },
      { name: 'Broadcast', link: '/broadcast' },
      { name: 'History Customer', link: '/history-customer' },
    ],
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar2() {
  return (
    <Disclosure as="nav" className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>

          {/* Left section: Logo */}
          <div className="flex flex-1 items-center justify-start sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <span className="text-2xl font-bold text-blue-400">Sales SAT</span>
            </div>

            {/* Navigation links (hidden on mobile) */}
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <div key={item.name} className="relative">
                    {item.submenu ? (
                      <Disclosure as="div" className="relative">
                        {({ open }) => (
                          <>
                            <DisclosureButton
                              className={classNames(
                                item.current ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                'rounded-md px-3 py-2 text-sm font-medium flex items-center'
                              )}
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m-9 4h12" />
                              </svg>
                              {item.name}
                              <ChevronDownIcon className={classNames('ml-2 h-5 w-5', open ? 'rotate-180' : '')} />
                            </DisclosureButton>
                            <DisclosurePanel className="absolute z-10 mt-2 w-48 rounded-md bg-gray-800 shadow-lg">
                              <div className="py-1">
                                {item.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.name}
                                    to={subItem.link}
                                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                                  >
                                    {subItem.name}
                                  </Link>
                                ))}
                              </div>
                            </DisclosurePanel>
                          </>
                        )}
                      </Disclosure>
                    ) : (
                      <Link
                        to={item.link}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'rounded-md px-3 py-2 text-sm font-medium flex items-center'
                        )}
                      >
                        {item.name === 'Dashboard' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h18M12 3v18"></path>
                          </svg>
                        )}
                        {item.name === 'Customer' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                          </svg>
                        )}
                        {item.name === 'Product' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0l-8 4m-8-4l8 4m0 0v10"></path>
                          </svg>
                        )}
                        {item.name === 'Batch' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a8 8 0 01-8 8m8-8a8 8 0 00-8-8m0 16a8 8 0 008-8m-8 0h.01"></path>
                          </svg>
                        )}
                        {item.name === 'Work' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18v18H3zM9 3v18m6-18v18"></path>
                          </svg>
                        )}
                        {item.name === 'Prospect' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15h8v-4h4v-2h4v6h2M11 15v4h2M17 15v4h2" />
                            <circle cx="12" cy="19" r="2" />
                            <circle cx="18" cy="19" r="2" />
                          </svg>
                        )}
                        {item.name === 'Broadcast' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15h8v-4h4v-2h4v6h2M11 15v4h2M17 15v4h2" />
                            <circle cx="12" cy="19" r="2" />
                            <circle cx="18" cy="19" r="2" />
                          </svg>
                        )}
                        {item.name === 'Setting WhatsApp' && (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15h8v-4h4v-2h4v6h2M11 15v4h2M17 15v4h2" />
                            <circle cx="12" cy="19" r="2" />
                            <circle cx="18" cy="19" r="2" />
                          </svg>
                        )}
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right section: User email and logout */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <span className="text-gray-300 mr-4">admin@email.com</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-gray-300 hover:text-white flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
            {/* Tools Dropdown/Menu */}
            <div className="relative group">
              <button className="px-4 py-2 text-gray-300 hover:bg-blue-600 hover:text-white rounded inline-flex items-center">
                <span>Tools</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute hidden group-hover:block bg-gray-900 border border-gray-700 rounded shadow-lg mt-2 min-w-[180px] z-50">
                <a
                  href="/ai-assistant"
                  className="block px-4 py-2 text-gray-300 hover:bg-blue-600 hover:text-white rounded"
                >
                  AI Assistant
                </a>
                <a
                  href="/whatsapp-setting"
                  className="block px-4 py-2 text-gray-300 hover:bg-blue-600 hover:text-white rounded"
                >
                  Setting WhatsApp
                </a>
                <a
                  href="/history-customer"
                  className="block px-4 py-2 text-gray-300 hover:bg-blue-600 hover:text-white rounded"
                >
                  History Customer
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu (Disclosure Panel) */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <Disclosure as="div" className="space-y-1">
                  {({ open }) => (
                    <>
                      <DisclosureButton
                        className={classNames(
                          item.current ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'block rounded-md px-3 py-2 text-base font-medium w-full text-left'
                        )}
                      >
                        {item.name}
                        <ChevronDownIcon className={classNames('ml-2 h-5 w-5 inline', open ? 'rotate-180' : '')} />
                      </DisclosureButton>
                      <DisclosurePanel className="space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.link}
                            className="block rounded-md px-5 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              ) : (
                <Link
                  to={item.link}
                  aria-current={item.current ? 'page' : undefined}
                  className={classNames(
                    item.current ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium'
                  )}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}