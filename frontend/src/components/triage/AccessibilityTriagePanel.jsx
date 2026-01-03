import { useState, useMemo } from 'react';
import {
  Shield, ExternalLink, Copy, ChevronRight, AlertTriangle, Check,
  Filter, X, FileText, Ticket, EyeOff, Clock, GitCompare,
  ChevronDown, Code, Globe, Hash, Sparkles, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Badge, SeverityBadge } from '../ui/Badge';
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter, SheetSection } from '../ui/Sheet';

/**
 * Accessibility Triage Panel - Master-detail layout for QA workflows
 *
 * Design Principles:
 * - Answers: Where, What, Why, What Next (not just "how many")
 * - Master-detail layout: left list, right details
 * - Actionable: Create ticket, assign, mark false positive
 * - Filterable: By severity, new/existing, WCAG criteria
 * - Evidence-focused: Shows affected nodes, selectors, snippets
 */

// Header with compact run context
function TriageHeader({ runDetails, violationCount, nodeCount, onClose }) {
  return (
    <div style={{
      backgroundColor: '#f9fafb',
      borderBottom: '2px solid #e5e7eb',
      padding: '16px 24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Shield size={24} color="#2563eb" style={{ flexShrink: 0 }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Accessibility Audit</h2>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: runDetails.failed > 0 ? '#fee2e2' : '#dcfce7',
              color: runDetails.failed > 0 ? '#dc2626' : '#166534'
            }}>
              {runDetails.failed > 0 ? 'Failed' : 'Passed'}
            </span>
          </div>

          {/* Subheader */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#4b5563' }}>
            <span style={{ fontWeight: 500 }}>{runDetails.website_name}</span>
            <span style={{ color: '#9ca3af' }}>|</span>
            <span>Run #{runDetails.id}</span>
            <span style={{ color: '#9ca3af' }}>|</span>
            <span>{new Date(runDetails.created_at).toLocaleString()}</span>
          </div>

          {/* Compact stats strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>{violationCount}</span>
              <span style={{ color: '#4b5563' }}>violations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, color: '#ea580c' }}>{nodeCount}</span>
              <span style={{ color: '#4b5563' }}>affected nodes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={16} color="#9ca3af" />
              <span style={{ color: '#4b5563' }}>1 page tested</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
          aria-label="Close"
        >
          <X size={20} color="#4b5563" />
        </button>
      </div>
    </div>
  );
}

// Filter chips for violations
function ViolationFilters({ filters, onFilterChange, violations }) {
  const severityCounts = useMemo(() => {
    return {
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
    };
  }, [violations]);

  const toggleFilter = (key) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  const severityColors = {
    critical: { active: '#dc2626', bg: '#fee2e2' },
    serious: { active: '#ea580c', bg: '#ffedd5' },
    moderate: { active: '#d97706', bg: '#fef3c7' },
    minor: { active: '#2563eb', bg: '#dbeafe' }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#fff'
    }}>
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginRight: '8px'
      }}>Filter:</span>

      {/* Severity filters */}
      {Object.entries(severityCounts).map(([severity, count]) => (
        count > 0 && (
          <button
            key={severity}
            onClick={() => toggleFilter(severity)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: filters[severity] ? severityColors[severity].active : '#f3f4f6',
              color: filters[severity] ? '#fff' : '#374151'
            }}
          >
            <span style={{ textTransform: 'capitalize' }}>{severity}</span>
            <span style={{ opacity: 0.8 }}>({count})</span>
          </button>
        )
      ))}

      {/* Clear filters */}
      {Object.values(filters).some(Boolean) && (
        <button
          onClick={() => onFilterChange({})}
          style={{
            fontSize: '12px',
            color: '#2563eb',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            marginLeft: '8px'
          }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

// Violation list item
function ViolationListItem({ violation, isSelected, onClick, index }) {
  const impactColors = {
    critical: { bg: '#fee2e2', color: '#dc2626' },
    serious: { bg: '#ffedd5', color: '#ea580c' },
    moderate: { bg: '#fef3c7', color: '#d97706' },
    minor: { bg: '#dbeafe', color: '#2563eb' }
  };
  const colors = impactColors[violation.impact] || impactColors.moderate;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '16px',
        borderBottom: '1px solid #f3f4f6',
        borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'block'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Severity badge */}
        <span style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          backgroundColor: colors.bg,
          color: colors.color
        }}>
          {violation.impact}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Rule title */}
          <div style={{
            fontWeight: 600,
            color: '#111827',
            fontSize: '14px',
            lineHeight: 1.4,
            marginBottom: '4px'
          }}>
            {violation.help}
          </div>

          {/* WCAG ref + nodes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
            {violation.wcag_tags && (
              <span style={{
                fontFamily: 'monospace',
                backgroundColor: '#f3f4f6',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {(() => {
                  try {
                    const tags = typeof violation.wcag_tags === 'string'
                      ? JSON.parse(violation.wcag_tags)
                      : violation.wcag_tags;
                    const wcagTag = tags.find(t => t.startsWith('wcag'));
                    return wcagTag || 'a11y';
                  } catch {
                    return 'a11y';
                  }
                })()}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Hash size={12} />
              {violation.nodes_affected} node{violation.nodes_affected !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9ca3af' }}>
              <Clock size={12} />
              Existing
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight
          size={16}
          color={isSelected ? '#2563eb' : '#9ca3af'}
          style={{
            flexShrink: 0,
            transform: isSelected ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s'
          }}
        />
      </div>
    </motion.button>
  );
}

// Detail panel for selected violation
function ViolationDetailPanel({ violation, onCreateTicket, onMarkFalsePositive }) {
  const [copiedSelector, setCopiedSelector] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSelector(true);
    setTimeout(() => setCopiedSelector(false), 2000);
  };

  // Parse WCAG tags
  const wcagTags = useMemo(() => {
    try {
      return typeof violation.wcag_tags === 'string'
        ? JSON.parse(violation.wcag_tags)
        : violation.wcag_tags || [];
    } catch {
      return [];
    }
  }, [violation.wcag_tags]);

  const impactColors = {
    critical: { bg: '#fee2e2', color: '#dc2626' },
    serious: { bg: '#ffedd5', color: '#ea580c' },
    moderate: { bg: '#fef3c7', color: '#d97706' },
    minor: { bg: '#dbeafe', color: '#2563eb' }
  };
  const colors = impactColors[violation.impact] || impactColors.moderate;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* Detail header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            backgroundColor: colors.bg,
            color: colors.color
          }}>
            {violation.impact}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', lineHeight: 1.3, margin: 0 }}>
              {violation.help}
            </h3>
            <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
              {violation.description}
            </p>
          </div>
        </div>
      </div>

      {/* Detail content - scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* WCAG Criteria */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            WCAG Criteria
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {wcagTags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Affected Nodes */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={16} />
            Affected Elements ({violation.nodes_affected})
          </h4>

          <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
            <div style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Note:</span> Detailed node information available in full report.
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>CSS Selector</span>
                <button
                  onClick={() => copyToClipboard('[role="menu"] > li:nth-child(1)')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {copiedSelector ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <code style={{ display: 'block', fontSize: '12px', backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '4px', fontFamily: 'monospace', color: '#374151' }}>
                [role="menu"] &gt; li:nth-child(1)
              </code>
            </div>
          </div>
        </div>

        {/* Recommended Fix */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#f59e0b" />
            Recommended Fix
          </h4>
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '16px', fontSize: '14px', color: '#065f46' }}>
            Ensure the element is contained within a parent element that has an appropriate ARIA role.
            For menu items, the parent should have <code style={{ backgroundColor: '#d1fae5', padding: '2px 4px', borderRadius: '4px' }}>role="menu"</code> or <code style={{ backgroundColor: '#d1fae5', padding: '2px 4px', borderRadius: '4px' }}>role="menubar"</code>.
          </div>
        </div>

        {/* Learn More */}
        <div>
          <a
            href={violation.help_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#2563eb', textDecoration: 'none' }}
          >
            <ExternalLink size={16} />
            Learn more at Deque University
            <ArrowUpRight size={12} />
          </a>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => onCreateTicket?.(violation)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          <Ticket size={16} />
          Create Ticket
        </button>
        <button
          onClick={() => onMarkFalsePositive?.(violation)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          <EyeOff size={16} />
          Mark False Positive
        </button>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          <GitCompare size={16} />
          Compare to Baseline
        </button>
      </div>
    </div>
  );
}

// Empty state when no violation selected
function EmptyDetailState() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      padding: '32px'
    }}>
      <Shield size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
      <p style={{ fontSize: '18px', fontWeight: 500, color: '#4b5563', marginBottom: '4px' }}>Select a violation</p>
      <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
        Click on a violation from the list to view details, affected elements, and recommended fixes.
      </p>
    </div>
  );
}

// Main Triage Panel Component
export function AccessibilityTriagePanel({
  isOpen,
  onClose,
  runDetails,
  violations = []
}) {
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [filters, setFilters] = useState({});

  // Calculate total affected nodes
  const totalNodes = useMemo(() => {
    return violations.reduce((sum, v) => sum + (v.nodes_affected || 0), 0);
  }, [violations]);

  // Filter violations
  const filteredViolations = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([_, active]) => active).map(([key]) => key);
    if (activeFilters.length === 0) return violations;
    return violations.filter(v => activeFilters.includes(v.impact));
  }, [violations, filters]);

  // Select first violation if none selected
  useMemo(() => {
    if (filteredViolations.length > 0 && !selectedViolation) {
      setSelectedViolation(filteredViolations[0]);
    }
  }, [filteredViolations, selectedViolation]);

  const handleCreateTicket = (violation) => {
    // Prefill ticket content
    const ticketContent = {
      title: `[A11y] ${violation.help}`,
      severity: violation.impact,
      description: violation.description,
      wcag: violation.wcag_tags,
      url: runDetails.website_url,
      nodes: violation.nodes_affected,
    };
    console.log('Create ticket:', ticketContent);
    alert(`Ticket created for: ${violation.help}\n\nIn a real implementation, this would open your ticketing system (Jira, Linear, etc.) with prefilled data.`);
  };

  const handleMarkFalsePositive = (violation) => {
    console.log('Mark false positive:', violation);
    alert(`Marked as false positive: ${violation.help}\n\nIn a real implementation, this would exclude this rule from future runs.`);
  };

  if (!runDetails) return null;

  return (
    <Sheet open={isOpen} onClose={onClose}>
      {/* Compact Header */}
      <TriageHeader
        runDetails={runDetails}
        violationCount={violations.length}
        nodeCount={totalNodes}
        onClose={onClose}
      />

      {/* Filter chips */}
      <ViolationFilters
        filters={filters}
        onFilterChange={setFilters}
        violations={violations}
      />

      {/* Master-Detail Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Violations list */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto',
          backgroundColor: '#fff'
        }}>
          {filteredViolations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
              <p style={{ fontSize: '14px' }}>No violations match the current filters.</p>
            </div>
          ) : (
            filteredViolations.map((violation, idx) => (
              <ViolationListItem
                key={idx}
                violation={violation}
                index={idx}
                isSelected={selectedViolation === violation}
                onClick={() => setSelectedViolation(violation)}
              />
            ))
          )}
        </div>

        {/* Right: Violation details */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {selectedViolation ? (
            <ViolationDetailPanel
              violation={selectedViolation}
              onCreateTicket={handleCreateTicket}
              onMarkFalsePositive={handleMarkFalsePositive}
            />
          ) : (
            <EmptyDetailState />
          )}
        </div>
      </div>

      {/* Footer with primary actions */}
      <div style={{
        padding: '16px 24px',
        borderTop: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '14px', color: '#4b5563' }}>
          <span style={{ fontWeight: 500 }}>{filteredViolations.length}</span> of{' '}
          <span style={{ fontWeight: 500 }}>{violations.length}</span> violations shown
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            <FileText size={16} />
            Export
            <ChevronDown size={12} />
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: '#4b5563',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export default AccessibilityTriagePanel;
