// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Calendar, Bell, AlertCircle, Sparkles, Check, ChevronDown } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function Header({ title, description, onMenuClick, actions }) {
  const { currency, setCurrency, config, allCurrencies, format } = useCurrency();
  const today = new Date('2026-10-09').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'anomaly',
      title: 'Spending Anomaly Detected',
      rawAmount: 28500,
      time: '2 hours ago',
      unread: true,
      icon: AlertCircle,
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
    },
    {
      id: 2,
      type: 'savings',
      title: 'Milestone Progress: Emergency Fund',
      savedAmount: 60000,
      targetAmount: 120000,
      time: '1 day ago',
      unread: true,
      icon: Sparkles,
      iconColor: '#4D7C0F',
      iconBg: '#F7FEE7',
    },
  ]);

  const dropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setCurrencyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markItemAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  return (
    <header style={{
      background: 'var(--bg-card, #FFFFFF)',
      borderBottom: '1px solid var(--border, #E5E0D5)',
      padding: '0 28px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Mobile hamburger button */}
      <button
        onClick={onMenuClick}
        className="mobile-menu-btn"
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: '#2D5A34',
          cursor: 'pointer',
          padding: 6,
          borderRadius: 6,
        }}
        aria-label="Open Navigation Menu"
      >
        <Menu size={20} />
      </button>

      {/* Title & Page Context */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#2D5A34',
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h1>
        {description && (
          <p style={{
            fontSize: 12,
            color: '#5A785E',
            marginTop: 2,
            letterSpacing: '-0.01em',
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Header Actions & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Quick Currency Switcher Dropdown */}
        <div style={{ position: 'relative' }} ref={currencyDropdownRef}>
          <button
            onClick={() => setCurrencyOpen(o => !o)}
            title="Change Operating Currency"
            aria-label="Change Operating Currency"
            style={{
              height: 34,
              borderRadius: 18,
              background: currencyOpen ? '#E8F0E9' : '#FFFFFF',
              border: '1px solid #D3E2D5',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 11px',
              color: '#2D5A34',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#B0CDB4';
              e.currentTarget.style.background = '#F6FAF7';
            }}
            onMouseLeave={e => {
              if (!currencyOpen) {
                e.currentTarget.style.borderColor = '#D3E2D5';
                e.currentTarget.style.background = '#FFFFFF';
              }
            }}
          >
            <span style={{ fontSize: 13 }}>{config.flag}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{currency} ({config.symbol})</span>
            <ChevronDown size={13} style={{ color: '#5A785E', transform: currencyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {currencyOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 250,
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #D3E2D5',
              boxShadow: '0 4px 16px rgba(45,90,52,0.08)',
              overflow: 'hidden',
              zIndex: 100,
              padding: 6,
              animation: 'fadeIn 0.15s ease-out',
            }}>
              <div style={{
                padding: '6px 10px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: '#2D5A34',
                opacity: 0.75,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #E8F0E9',
                marginBottom: 4,
              }}>
                Select Active Currency
              </div>
              {Object.values(allCurrencies).map((item) => {
                const isSelected = item.code === currency;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      setCurrency(item.code);
                      setCurrencyOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: isSelected ? '#F0FDF4' : 'transparent',
                      color: isSelected ? '#15803D' : '#1E293B',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{item.flag}</span>
                      <div>
                        <div>{item.code} ({item.symbol})</div>
                        <div style={{ fontSize: 10, color: isSelected ? '#15803D' : '#64748B', fontWeight: 400 }}>
                          {item.code === 'INR' ? 'Base Currency (1.0x)' : `1 ${item.code} ≈ ₹${(1 / item.rateFromINR).toFixed(1)}`}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: '#15803D', strokeWidth: 2.5 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#2D5A34',
          background: '#FFFFFF',
          padding: '5px 12px',
          borderRadius: 20,
          border: '1px solid #D3E2D5',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}>
          <Calendar size={13} style={{ color: '#4A9C5D' }} />
          {today}
        </span>

        {/* Notifications Icon with Badge & Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setNotificationsOpen(o => !o)}
            title="Notifications"
            aria-label="View notifications"
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: notificationsOpen ? '#E8F0E9' : '#FFFFFF',
              border: '1px solid #D3E2D5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2D5A34',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#B0CDB4';
              e.currentTarget.style.background = '#F6FAF7';
            }}
            onMouseLeave={e => {
              if (!notificationsOpen) {
                e.currentTarget.style.borderColor = '#D3E2D5';
                e.currentTarget.style.background = '#FFFFFF';
              }
            }}
          >
            <Bell size={18} style={{ color: '#2D5A34' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: '#DC2626',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 800,
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
                boxShadow: 'none',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Flyout */}
          {notificationsOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 340,
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #D3E2D5',
              boxShadow: '0 4px 16px rgba(45,90,52,0.08)',
              overflow: 'hidden',
              zIndex: 100,
              animation: 'fadeIn 0.15s ease-out',
            }}>
              {/* Dropdown Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #E8F0E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#E8F0E9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2D5A34' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FCA5A5',
                      padding: '1px 6px',
                      borderRadius: 10,
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#4A9C5D',
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => markItemAsRead(item.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #F8FAFC',
                        background: item.unread ? '#F8FAFC' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                      onMouseLeave={e => e.currentTarget.style.background = item.unread ? '#F8FAFC' : '#FFFFFF'}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: item.iconBg,
                        color: item.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: item.unread ? 700 : 600,
                          color: '#0F172A',
                          marginBottom: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <span>{item.title}</span>
                          {item.unread && (
                            <span style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#3B82F6',
                              display: 'inline-block',
                            }} />
                          )}
                        </div>
                        <p style={{
                          fontSize: 11,
                          color: '#475569',
                          lineHeight: 1.45,
                          margin: 0,
                        }}>
                          {item.type === 'anomaly'
                            ? `${format(item.rawAmount)} Laptop Motherboard Repair on Oct 5 exceeded your uncategorized average by 6,767%.`
                            : item.type === 'savings'
                            ? `${format(item.savedAmount)} / ${format(item.targetAmount)} (50% funded). On track to hit target with November salary surplus.`
                            : item.message}
                        </p>
                        <div style={{
                          fontSize: 10,
                          color: '#94A3B8',
                          marginTop: 4,
                          fontWeight: 500,
                        }}>
                          {item.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dropdown Footer */}
              <div style={{
                padding: '8px 16px',
                borderTop: '1px solid #F1F5F9',
                background: '#FAFAFA',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                  Personalized by Finassist AI Engine
                </span>
              </div>
            </div>
          )}
        </div>

        {actions}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
