#!/bin/bash

# Run Security Tests Script
# This script runs all security tests and generates reports

# Create output directory
mkdir -p test-results/security

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   CloudWeave Security Testing Suite     ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Run vulnerability scanning
echo -e "\n${YELLOW}Running Vulnerability Scanning...${NC}"
npm run test:security:vulnerability
VULN_EXIT=$?

# Run compliance testing
echo -e "\n${YELLOW}Running Compliance Testing...${NC}"
npm run test:security:compliance
COMP_EXIT=$?

# Run penetration testing
echo -e "\n${YELLOW}Running Penetration Testing...${NC}"
npm run test:security:penetration
PEN_EXIT=$?

# Run audit trail testing
echo -e "\n${YELLOW}Running Audit Trail Testing...${NC}"
npm run test:security:audit
AUDIT_EXIT=$?

# Generate security report
echo -e "\n${YELLOW}Generating Security Reports...${NC}"
npm run test:security:report
REPORT_EXIT=$?

# Print summary
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}          Security Test Summary          ${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $VULN_EXIT -eq 0 ]; then
  echo -e "Vulnerability Scanning: ${GREEN}PASSED${NC}"
else
  echo -e "Vulnerability Scanning: ${RED}REVIEW REQUIRED${NC}"
fi

if [ $COMP_EXIT -eq 0 ]; then
  echo -e "Compliance Testing:    ${GREEN}PASSED${NC}"
else
  echo -e "Compliance Testing:    ${RED}REVIEW REQUIRED${NC}"
fi

if [ $PEN_EXIT -eq 0 ]; then
  echo -e "Penetration Testing:   ${GREEN}PASSED${NC}"
else
  echo -e "Penetration Testing:   ${RED}REVIEW REQUIRED${NC}"
fi

if [ $AUDIT_EXIT -eq 0 ]; then
  echo -e "Audit Trail Testing:   ${GREEN}PASSED${NC}"
else
  echo -e "Audit Trail Testing:   ${RED}REVIEW REQUIRED${NC}"
fi

echo -e "\n${BLUE}Reports generated in:${NC} test-results/security/"

# Exit with combined status
if [ $VULN_EXIT -eq 0 ] && [ $COMP_EXIT -eq 0 ] && [ $PEN_EXIT -eq 0 ] && [ $AUDIT_EXIT -eq 0 ]; then
  echo -e "\n${GREEN}All security tests passed!${NC}"
  exit 0
else
  echo -e "\n${YELLOW}Some security tests require review. See reports for details.${NC}"
  exit 1
fi