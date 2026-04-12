import { useEffect, useRef, useState } from 'react'

/**
 * CustomSelect: Mobile-friendly dropdown that opens downward with scroll support
 * Uses fixed positioning to escape overflow constraints
 */
export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)
  const menuRef = useRef(null)
  const searchInputRef = useRef(null)
  const triggerRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 })

  // Get the display text for the selected value
  const selectedOption = options.find((opt) => String(opt.id) === String(value))
  const displayText = selectedOption?.name || placeholder

  // Filter options based on search term
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate menu position when dropdown opens
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const isMobile = window.innerWidth <= 640
    const viewportHeight = window.innerHeight
    
    if (isMobile) {
      // Mobile: position below trigger, capped to viewport height
      const spaceBelow = viewportHeight - rect.bottom
      const maxHeightPx = Math.max(150, spaceBelow - 10) // Min 150px, max is space below
      
      setMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
        right: window.innerWidth - rect.right,
        width: rect.width,
        maxHeight: `${maxHeightPx}px`,
        isMobile: true,
      })
    } else {
      // Desktop: position below trigger with smart direction
      const spaceBelow = viewportHeight - rect.bottom
      const menuHeight = Math.min(320, filteredOptions.length * 44 + (filteredOptions.length > 5 ? 50 : 0))
      
      // If not enough space below, open upward
      const shouldOpenUp = spaceBelow < menuHeight + 10 && rect.top > menuHeight + 10
      
      setMenuPosition({
        top: shouldOpenUp ? rect.top - menuHeight : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        height: 'auto',
        isMobile: false,
      })
    }
  }, [isOpen, filteredOptions.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target) && 
          menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Auto-focus search input on mobile
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Lock body scroll on mobile when dropdown is open (optional, for better UX)
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll while dropdown is active to avoid accidental page scroll
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : i))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((i) => (i > 0 ? i - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0) {
            const option = filteredOptions[highlightedIndex]
            onChange?.({ target: { value: String(option.id) } })
            setIsOpen(false)
            setSearchTerm('')
          }
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, filteredOptions, onChange])

  const handleOptionClick = (optionId) => {
    onChange?.({ target: { value: String(optionId) } })
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleMenuOpen = () => {
    setIsOpen(true)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  return (
    <div
      ref={selectRef}
      className={`customSelectWrapper ${className}`}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      id={id}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className={`customSelectTrigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleMenuOpen}
        disabled={disabled}
        aria-label={displayText}
      >
        <span className="customSelectValue">{displayText}</span>
        <svg
          className="customSelectArrow"
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 11L3 6h10l-5 5z" />
        </svg>
      </button>

      {/* Dropdown Menu - Using Portal-like positioning with fixed */}
      {isOpen && (
        <>
          <div
            ref={menuRef}
            className={`customSelectMenu ${menuPosition.isMobile ? 'mobile' : 'desktop'}`}
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              right: menuPosition.isMobile ? menuPosition.right : 'auto',
              width: menuPosition.width,
              height: menuPosition.height,
              maxHeight: menuPosition.maxHeight || 'auto',
            }}
            role="listbox"
          >
            {/* Search input for mobile/long lists */}
            {filteredOptions.length > 5 && (
              <input
                ref={searchInputRef}
                type="text"
                className="customSelectSearch"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setHighlightedIndex(-1)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {/* Options List */}
            <div className="customSelectOptions">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`customSelectOption ${index === highlightedIndex ? 'highlighted' : ''} ${
                      String(option.id) === String(value) ? 'selected' : ''
                    }`}
                    onClick={() => handleOptionClick(option.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={String(option.id) === String(value)}
                  >
                    {option.name}
                  </button>
                ))
              ) : (
                <div className="customSelectEmpty">No options found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

