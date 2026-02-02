import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  FileText,
  Calculator,
  TrendingUp,
  Search,
  ChevronDown,
  Plus,
  Trash2,
  Lock,
  AlertTriangle,
  X,
  Check,
  Building2,
  Users,
  DollarSign,
  Clock,
  Target,
} from "lucide-react";

// Rate card lookup
const RATE_CARD = {
  Partner: 450,
  "Senior Manager": 350,
  Manager: 300,
  "Senior Associate": 250,
  Associate: 175,
};

const LEVELS = Object.keys(RATE_CARD);

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage
const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};

export default function FlexForecastApp() {
  // ============================================
  // CENTRALIZED STATE
  // ============================================
  const [activeView, setActiveView] = useState("initiation");

  // View 1 - Engagement Initiation State
  const [opportunityId, setOpportunityId] = useState("");
  const [dealLoaded, setDealLoaded] = useState(false);
  const [dealDetails, setDealDetails] = useState({
    client: "",
    product: "",
    stage: "",
  });
  const [interTerritory, setInterTerritory] = useState(false);
  const [approver, setApprover] = useState("");
  const [workLocation, setWorkLocation] = useState("US");
  const [riskApproved, setRiskApproved] = useState(false);

  // View 2 - Budgeting State
  const [pricingStructure, setPricingStructure] = useState("Fixed Fee");
  const [useRateCard, setUseRateCard] = useState(false);
  const [targetFee, setTargetFee] = useState(125000);
  const [staffing, setStaffing] = useState([
    { id: 1, name: "J. Smith", level: "Partner", rate: 450, hours: 40 },
    { id: 2, name: "A. Lee", level: "Senior Associate", rate: 250, hours: 120 },
  ]);
  const [nextStaffId, setNextStaffId] = useState(3);

  // View 3 - Forecasting State
  const [alertVisible, setAlertVisible] = useState(true);
  const [highlightedResource, setHighlightedResource] = useState(null);
  const [actuals, setActuals] = useState([
    { id: 1, name: "J. Smith", level: "Partner", rate: 450, budgetHours: 40, actualHours: 35, etcHours: 5 },
    { id: 2, name: "A. Lee", level: "Senior Associate", rate: 250, budgetHours: 120, actualHours: 95, etcHours: 20 },
    { id: 3, name: "M. Chen", level: "Associate", rate: 175, budgetHours: 0, actualHours: 12, etcHours: 0 },
  ]);

  const etcInputRef = useRef(null);

  // ============================================
  // DERIVED CALCULATIONS
  // ============================================

  // View 2 Calculations
  const totalBudgetCost = staffing.reduce((sum, s) => sum + s.rate * s.hours, 0);
  const totalBudgetHours = staffing.reduce((sum, s) => sum + s.hours, 0);
  const projectedMargin = targetFee > 0 ? ((targetFee - totalBudgetCost) / targetFee) * 100 : 0;
  const marginIsHealthy = projectedMargin >= 40;

  // View 3 Calculations
  const totalActualCost = actuals.reduce((sum, a) => sum + a.rate * a.actualHours, 0);
  const totalActualHours = actuals.reduce((sum, a) => sum + a.actualHours, 0);
  const totalProjectedCost = actuals.reduce((sum, a) => sum + a.rate * (a.actualHours + a.etcHours), 0);
  const totalProjectedHours = actuals.reduce((sum, a) => sum + a.actualHours + a.etcHours, 0);
  const projectedProfit = targetFee - totalProjectedCost;
  const profitIsPositive = projectedProfit >= 0;

  // Sync budget hours from View 2 to View 3
  useEffect(() => {
    setActuals((prev) =>
      prev.map((a) => {
        const budgetRow = staffing.find((s) => s.id === a.id);
        if (budgetRow) {
          return { ...a, budgetHours: budgetRow.hours, rate: budgetRow.rate };
        }
        return a;
      })
    );
  }, [staffing]);

  // Unbudgeted resources
  const unbudgetedResources = actuals.filter((a) => a.budgetHours === 0 && a.actualHours > 0);

  // ============================================
  // HANDLERS
  // ============================================

  // Opportunity lookup with debounce simulation
  useEffect(() => {
    if (opportunityId.toUpperCase() === "OPP-1024") {
      const timer = setTimeout(() => {
        setDealLoaded(true);
        setDealDetails({
          client: "Acme Corp",
          product: "Tax Compliance",
          stage: "Interact",
        });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDealLoaded(false);
      setDealDetails({ client: "", product: "", stage: "" });
    }
  }, [opportunityId]);

  // Staffing handlers
  const updateStaffRow = (id, field, value) => {
    setStaffing((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        // Auto-populate rate when level changes (if rate card is off)
        if (field === "level" && !useRateCard) {
          updated.rate = RATE_CARD[value] || 0;
        }
        return updated;
      })
    );
  };

  const addStaffRow = () => {
    setStaffing((prev) => [
      ...prev,
      { id: nextStaffId, name: "TBD", level: "Associate", rate: RATE_CARD["Associate"], hours: 0 },
    ]);
    setNextStaffId((prev) => prev + 1);
  };

  const deleteStaffRow = (id) => {
    setStaffing((prev) => prev.filter((row) => row.id !== id));
  };

  // Rate card toggle handler
  const handleRateCardToggle = () => {
    if (!useRateCard) {
      // Turning ON - reset rates to defaults
      setStaffing((prev) =>
        prev.map((row) => ({
          ...row,
          rate: RATE_CARD[row.level] || 0,
        }))
      );
    }
    setUseRateCard(!useRateCard);
  };

  // ETC handlers
  const updateEtc = (id, value) => {
    const numValue = parseInt(value) || 0;
    setActuals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, etcHours: numValue } : a))
    );
    // Auto-dismiss alert if unbudgeted resource gets ETC assigned
    const resource = actuals.find((a) => a.id === id);
    if (resource && resource.budgetHours === 0 && numValue > 0) {
      setAlertVisible(false);
      setHighlightedResource(null);
    }
  };

  const handleAssignEtc = () => {
    const unbudgeted = actuals.find((a) => a.budgetHours === 0 && a.actualHours > 0);
    if (unbudgeted) {
      setHighlightedResource(unbudgeted.id);
      // Focus the input after a brief delay for render
      setTimeout(() => {
        if (etcInputRef.current) {
          etcInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleDismissAlert = () => {
    setAlertVisible(false);
    setHighlightedResource(null);
  };

  // ============================================
  // NAVIGATION ITEMS
  // ============================================
  const navItems = [
    { id: "initiation", label: "Code Create", icon: FileText },
    { id: "budgeting", label: "Flex Plan", icon: Calculator },
    { id: "forecasting", label: "Forecasting", icon: TrendingUp },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans text-sm">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-slate-100">Practice Mgmt</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                  isActive
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Context Footer */}
        {dealLoaded && (
          <div className="p-3 border-t border-slate-800 bg-slate-900/50">
            <div className="text-xs text-slate-500 mb-1">Active Engagement</div>
            <div className="text-sm font-medium text-slate-200">{dealDetails.client}</div>
            <div className="text-xs text-slate-400">{dealDetails.product}</div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-100">
                {navItems.find((n) => n.id === activeView)?.label}
              </h1>
              {dealLoaded && (
                <p className="text-xs text-slate-400">
                  {dealDetails.client} • {dealDetails.product}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 bg-slate-800 rounded">Target: 42%</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="p-6">
          {activeView === "initiation" && (
            <ViewInitiation
              opportunityId={opportunityId}
              setOpportunityId={setOpportunityId}
              dealLoaded={dealLoaded}
              dealDetails={dealDetails}
              interTerritory={interTerritory}
              setInterTerritory={setInterTerritory}
              approver={approver}
              setApprover={setApprover}
              workLocation={workLocation}
              setWorkLocation={setWorkLocation}
              riskApproved={riskApproved}
              setRiskApproved={setRiskApproved}
            />
          )}
          {activeView === "budgeting" && (
            <ViewBudgeting
              pricingStructure={pricingStructure}
              setPricingStructure={setPricingStructure}
              useRateCard={useRateCard}
              handleRateCardToggle={handleRateCardToggle}
              staffing={staffing}
              updateStaffRow={updateStaffRow}
              addStaffRow={addStaffRow}
              deleteStaffRow={deleteStaffRow}
              targetFee={targetFee}
              setTargetFee={setTargetFee}
              totalBudgetCost={totalBudgetCost}
              totalBudgetHours={totalBudgetHours}
              projectedMargin={projectedMargin}
              marginIsHealthy={marginIsHealthy}
            />
          )}
          {activeView === "forecasting" && (
            <ViewForecasting
              alertVisible={alertVisible}
              unbudgetedResources={unbudgetedResources}
              handleAssignEtc={handleAssignEtc}
              handleDismissAlert={handleDismissAlert}
              highlightedResource={highlightedResource}
              actuals={actuals}
              updateEtc={updateEtc}
              etcInputRef={etcInputRef}
              targetFee={targetFee}
              totalBudgetCost={totalBudgetCost}
              totalBudgetHours={totalBudgetHours}
              totalActualCost={totalActualCost}
              totalActualHours={totalActualHours}
              totalProjectedCost={totalProjectedCost}
              totalProjectedHours={totalProjectedHours}
              projectedProfit={projectedProfit}
              profitIsPositive={profitIsPositive}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================
// VIEW 1: ENGAGEMENT INITIATION
// ============================================
function ViewInitiation({
  opportunityId,
  setOpportunityId,
  dealLoaded,
  dealDetails,
  interTerritory,
  setInterTerritory,
  approver,
  setApprover,
  workLocation,
  setWorkLocation,
  riskApproved,
  setRiskApproved,
}) {
  const sapCodes = [
    { type: "Master Contract", count: 1, status: "Required" },
    { type: "WBS Element", count: 2, status: "Required" },
    { type: "Cost Center Link", count: 1, status: interTerritory ? "Required" : "Optional" },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Salesforce Lookup */}
      <section className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-medium text-slate-200">Salesforce Lookup</h2>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              placeholder="Enter Opportunity ID (e.g., OPP-1024)"
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {opportunityId && !dealLoaded && (
            <p className="mt-2 text-xs text-slate-500">Searching...</p>
          )}
        </div>
      </section>

      {/* Deal Details Card */}
      {dealLoaded && (
        <section className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-medium text-slate-200">Deal Details</h2>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Client</div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-slate-100">{dealDetails.client}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Product</div>
              <div className="text-slate-100">{dealDetails.product}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Stage</div>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                {dealDetails.stage}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Smart Questionnaire */}
      <section className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-medium text-slate-200">Smart Questionnaire</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Inter-territory Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Inter-territory?</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInterTerritory(!interTerritory)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  interTerritory ? "bg-blue-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    interTerritory ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              {interTerritory && (
                <select
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Approver</option>
                  <option value="R. Johnson">R. Johnson (EMEA)</option>
                  <option value="S. Patel">S. Patel (APAC)</option>
                  <option value="M. Williams">M. Williams (Americas)</option>
                </select>
              )}
            </div>
          </div>

          {/* Work Location */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Work Location</label>
            <select
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
            </select>
          </div>

          {/* Risk Profile Approval */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <label className="text-sm text-slate-300">Risk Profile Approved?</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={riskApproved}
                onChange={(e) => setRiskApproved(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <span className="text-xs text-slate-400">Confirmed</span>
            </label>
          </div>
        </div>
      </section>

      {/* SAP Codes Table */}
      <section className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-medium text-slate-200">Required SAP Codes</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-700">
              <th className="text-left px-4 py-2 font-medium">Code Type</th>
              <th className="text-center px-4 py-2 font-medium">Count</th>
              <th className="text-right px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sapCodes.map((code, idx) => (
              <tr key={idx} className="border-b border-slate-700/50 last:border-0">
                <td className="px-4 py-2 text-slate-200">{code.type}</td>
                <td className="px-4 py-2 text-center text-slate-300">{code.count}</td>
                <td className="px-4 py-2 text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      code.status === "Required"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-600/50 text-slate-400"
                    }`}
                  >
                    {code.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          disabled={!riskApproved || !dealLoaded}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            riskApproved && dealLoaded
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          Create SAP Codes
        </button>
      </div>
    </div>
  );
}

// ============================================
// VIEW 2: BUDGETING
// ============================================
function ViewBudgeting({
  pricingStructure,
  setPricingStructure,
  useRateCard,
  handleRateCardToggle,
  staffing,
  updateStaffRow,
  addStaffRow,
  deleteStaffRow,
  targetFee,
  setTargetFee,
  totalBudgetCost,
  totalBudgetHours,
  projectedMargin,
  marginIsHealthy,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <div className="flex gap-6">
      {/* Left: Staffing Grid */}
      <div className="flex-1">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Pricing:</label>
              <select
                value={pricingStructure}
                onChange={(e) => setPricingStructure(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option>Fixed Fee</option>
                <option>T&M</option>
                <option>Capped Fee</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Use Rate Card</label>
            <button
              onClick={handleRateCardToggle}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                useRateCard ? "bg-blue-500" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  useRateCard ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Staffing Grid */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 bg-slate-900/50">
                <th className="text-left px-3 py-2 font-medium w-8"></th>
                <th className="text-left px-3 py-2 font-medium">Name</th>
                <th className="text-left px-3 py-2 font-medium">Level</th>
                <th className="text-right px-3 py-2 font-medium">Rate</th>
                <th className="text-right px-3 py-2 font-medium">Hours</th>
                <th className="text-right px-3 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {staffing.map((row) => (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="border-t border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="px-3 py-1.5 w-8">
                    {hoveredRow === row.id && (
                      <button
                        onClick={() => deleteStaffRow(row.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateStaffRow(row.id, "name", e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border-0 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={row.level}
                      onChange={(e) => updateStaffRow(row.id, "level", e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border-0 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded appearance-none cursor-pointer"
                    >
                      {LEVELS.map((level) => (
                        <option key={level} value={level} className="bg-slate-800">
                          {level}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {useRateCard && <Lock className="w-3 h-3 text-slate-500" />}
                      <input
                        type="number"
                        value={row.rate}
                        onChange={(e) => updateStaffRow(row.id, "rate", parseInt(e.target.value) || 0)}
                        disabled={useRateCard}
                        className={`w-20 px-2 py-1 text-right border-0 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          useRateCard
                            ? "bg-slate-700/50 text-slate-400 cursor-not-allowed"
                            : "bg-transparent text-slate-100"
                        }`}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <input
                      type="number"
                      value={row.hours}
                      onChange={(e) => updateStaffRow(row.id, "hours", parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 bg-transparent border-0 text-slate-100 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-slate-200">
                    {formatCurrency(row.rate * row.hours)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-600 bg-slate-900/30">
                <td colSpan={4} className="px-3 py-2">
                  <button
                    onClick={addStaffRow}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Resource
                  </button>
                </td>
                <td className="px-3 py-2 text-right text-xs text-slate-400">
                  {totalBudgetHours} hrs
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-100">
                  {formatCurrency(totalBudgetCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Right: Financial Sidebar */}
      <div className="w-72 space-y-4">
        {/* Target Fee */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Target Fee
            </h3>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              value={targetFee}
              onChange={(e) => setTargetFee(parseInt(e.target.value) || 0)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-md text-lg font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Total Cost
            </h3>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {formatCurrency(totalBudgetCost)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {staffing.length} resources • {totalBudgetHours} hours
          </div>
        </div>

        {/* Target Margin */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Target Margin
            </h3>
          </div>
          <div className="text-2xl font-bold text-slate-400">42%</div>
        </div>

        {/* Projected Margin */}
        <div
          className={`rounded-lg border p-4 ${
            marginIsHealthy
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp
              className={`w-4 h-4 ${marginIsHealthy ? "text-emerald-400" : "text-red-400"}`}
            />
            <h3
              className={`text-xs font-medium uppercase tracking-wide ${
                marginIsHealthy ? "text-emerald-400" : "text-red-400"
              }`}
            >
              Projected Margin
            </h3>
          </div>
          <div
            className={`text-3xl font-bold ${
              marginIsHealthy ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPercent(projectedMargin)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {marginIsHealthy ? "Above target" : "Below 40% target"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VIEW 3: FORECASTING
// ============================================
function ViewForecasting({
  alertVisible,
  unbudgetedResources,
  handleAssignEtc,
  handleDismissAlert,
  highlightedResource,
  actuals,
  updateEtc,
  etcInputRef,
  targetFee,
  totalBudgetCost,
  totalBudgetHours,
  totalActualCost,
  totalActualHours,
  totalProjectedCost,
  totalProjectedHours,
  projectedProfit,
  profitIsPositive,
}) {
  return (
    <div className="space-y-6">
      {/* Unbudgeted Alert */}
      {alertVisible && unbudgetedResources.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-300">
                  {unbudgetedResources.length} resource charging time not on budget
                </h3>
                <p className="text-xs text-amber-400/70 mt-1">
                  {unbudgetedResources[0].name} ({unbudgetedResources[0].level}) has logged{" "}
                  {unbudgetedResources[0].actualHours} hours with no budget allocation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAssignEtc}
                className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-xs font-medium rounded hover:bg-amber-500/30 transition-colors"
              >
                Assign ETC
              </button>
              <button
                onClick={handleDismissAlert}
                className="p-1.5 text-amber-400/70 hover:text-amber-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projected Profit Card */}
      <div
        className={`rounded-lg border p-6 ${
          profitIsPositive
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={`text-xs font-medium uppercase tracking-wide ${
                profitIsPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              Projected Profit
            </h3>
            <div
              className={`text-4xl font-bold mt-1 ${
                profitIsPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {profitIsPositive ? "+" : ""}
              {formatCurrency(projectedProfit)}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Fee: {formatCurrency(targetFee)}</div>
            <div>Projected Cost: {formatCurrency(totalProjectedCost)}</div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-medium text-slate-200">Budget vs Actuals vs Projected</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-400 bg-slate-900/50">
              <th className="text-left px-4 py-2 font-medium">Metric</th>
              <th className="text-right px-4 py-2 font-medium">Budget</th>
              <th className="text-right px-4 py-2 font-medium">Actuals</th>
              <th className="text-right px-4 py-2 font-medium">Projected</th>
              <th className="text-right px-4 py-2 font-medium">Variance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-700/50">
              <td className="px-4 py-2.5 text-slate-300">Hours</td>
              <td className="px-4 py-2.5 text-right text-slate-200">{totalBudgetHours}</td>
              <td className="px-4 py-2.5 text-right text-slate-200">{totalActualHours}</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-100">
                {totalProjectedHours}
              </td>
              <td
                className={`px-4 py-2.5 text-right text-sm ${
                  totalProjectedHours <= totalBudgetHours ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {totalProjectedHours - totalBudgetHours >= 0 ? "+" : ""}
                {totalProjectedHours - totalBudgetHours}
              </td>
            </tr>
            <tr className="border-t border-slate-700/50">
              <td className="px-4 py-2.5 text-slate-300">Cost</td>
              <td className="px-4 py-2.5 text-right text-slate-200">
                {formatCurrency(totalBudgetCost)}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-200">
                {formatCurrency(totalActualCost)}
              </td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-100">
                {formatCurrency(totalProjectedCost)}
              </td>
              <td
                className={`px-4 py-2.5 text-right text-sm ${
                  totalProjectedCost <= totalBudgetCost ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {totalProjectedCost - totalBudgetCost >= 0 ? "+" : ""}
                {formatCurrency(totalProjectedCost - totalBudgetCost)}
              </td>
            </tr>
            <tr className="border-t border-slate-700/50">
              <td className="px-4 py-2.5 text-slate-300">Revenue</td>
              <td className="px-4 py-2.5 text-right text-slate-200">{formatCurrency(targetFee)}</td>
              <td className="px-4 py-2.5 text-right text-slate-400">—</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-100">
                {formatCurrency(targetFee)}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-400">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ETC by Resource */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-medium text-slate-200">ETC by Resource</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-400 bg-slate-900/50">
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Level</th>
              <th className="text-right px-4 py-2 font-medium">Budget</th>
              <th className="text-right px-4 py-2 font-medium">Charged</th>
              <th className="text-right px-4 py-2 font-medium">ETC Hours</th>
              <th className="text-right px-4 py-2 font-medium">Projected</th>
            </tr>
          </thead>
          <tbody>
            {actuals.map((resource) => {
              const isHighlighted = highlightedResource === resource.id;
              const isUnbudgeted = resource.budgetHours === 0 && resource.actualHours > 0;
              return (
                <tr
                  key={resource.id}
                  className={`border-t border-slate-700/50 transition-colors ${
                    isHighlighted ? "ring-2 ring-amber-500 ring-inset bg-amber-500/10" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {isUnbudgeted && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="Unbudgeted" />
                      )}
                      <span className="text-slate-200">{resource.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{resource.level}</td>
                  <td className="px-4 py-2.5 text-right text-slate-200">
                    {resource.budgetHours || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-200">{resource.actualHours}</td>
                  <td className="px-4 py-2.5 text-right">
                    <input
                      ref={isHighlighted ? etcInputRef : null}
                      type="number"
                      value={resource.etcHours}
                      onChange={(e) => updateEtc(resource.id, e.target.value)}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-right text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-100">
                    {resource.actualHours + resource.etcHours}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600 bg-slate-900/30">
              <td colSpan={2} className="px-4 py-2 text-xs text-slate-500">
                Total
              </td>
              <td className="px-4 py-2 text-right text-xs text-slate-400">{totalBudgetHours}</td>
              <td className="px-4 py-2 text-right text-xs text-slate-400">{totalActualHours}</td>
              <td className="px-4 py-2 text-right text-xs text-slate-400">
                {actuals.reduce((sum, a) => sum + a.etcHours, 0)}
              </td>
              <td className="px-4 py-2 text-right text-sm font-semibold text-slate-100">
                {totalProjectedHours}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
