#!/usr/bin/env node

/**
 * verify-installation.sh
 * 
 * Quick verification script to check that all Dashboard Widget Personalization
 * files are properly installed and ready for integration.
 * 
 * Usage: node verify-installation.js
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
    // Context
    'src/context/DashboardLayoutContext.tsx',

    // Hooks
    'src/hooks/useDashboardLayout.ts',
    'src/hooks/useDragAndDropWidgets.ts',

    // Components
    'src/components/ui/DraggableWidget.tsx',
    'src/components/ui/DraggableWidget.module.css',
    'src/components/ui/DashboardWidgetSettings.tsx',
    'src/components/ui/DashboardWidgetSettings.module.css',

    // Services
    'src/services/dashboardLayoutService.ts',

    // Documentation
    '00_START_HERE.md',
    'QUICK_INTEGRATION_GUIDE.md',
    'REFERENCE_IMPLEMENTATION.md',
    'DASHBOARD_PERSONALIZATION.md',
    'IMPLEMENTATION_SUMMARY.md',
    'DOCS_INDEX.md',
];

console.log('🔍 Verifying Dashboard Widget Personalization Installation\n');
console.log('═'.repeat(60));

let allFound = true;
let foundCount = 0;
let missingCount = 0;

requiredFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);

    if (exists) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`✅ ${file} (${sizeKB}KB)`);
        foundCount++;
    } else {
        console.log(`❌ ${file} - NOT FOUND`);
        allFound = false;
        missingCount++;
    }
});

console.log('═'.repeat(60));
console.log(`\n📊 Results: ${foundCount}/${requiredFiles.length} files found\n`);

if (allFound) {
    console.log('✅ SUCCESS! All required files are installed.\n');
    console.log('Next steps:');
    console.log('1. Read: 00_START_HERE.md');
    console.log('2. Follow: QUICK_INTEGRATION_GUIDE.md');
    console.log('3. Reference: REFERENCE_IMPLEMENTATION.md\n');
    process.exit(0);
} else {
    console.log(`❌ ERROR: ${missingCount} file(s) missing!\n`);
    console.log('Please copy the missing files and try again.\n');
    process.exit(1);
}
