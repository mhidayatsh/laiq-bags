#!/usr/bin/env node

// Test the getColorDisplay function with various color formats
function getColorDisplay(color) {
    if (!color) return null;
    
    // If color is a string, return as is
    if (typeof color === 'string') return color;
    
    // If color is an object with name property
    if (color.name) return color.name;
    
    // If color is an object with other properties, try to find a displayable value
    if (typeof color === 'object') {
        // Check common color properties
        if (color.value) return color.value;
        if (color.label) return color.label;
        if (color.code) return color.code;
        
        // If it's an array, take the first item
        if (Array.isArray(color) && color.length > 0) {
            return getColorDisplay(color[0]);
        }
    }
    
    return 'N/A';
}

console.log('🎨 Testing Color Display Function');
console.log('================================\n');

// Test cases
const testCases = [
    { input: null, description: 'null' },
    { input: undefined, description: 'undefined' },
    { input: 'Red', description: 'string color' },
    { input: { name: 'Blue', code: '#0000ff' }, description: 'object with name' },
    { input: { value: 'Green', code: '#00ff00' }, description: 'object with value' },
    { input: { label: 'Yellow', code: '#ffff00' }, description: 'object with label' },
    { input: { code: '#ff0000' }, description: 'object with only code' },
    { input: ['Purple', 'Orange'], description: 'array of colors' },
    { input: { random: 'data' }, description: 'object with random data' },
    { input: 123, description: 'number' },
    { input: true, description: 'boolean' }
];

testCases.forEach((testCase, index) => {
    const result = getColorDisplay(testCase.input);
    console.log(`${index + 1}. ${testCase.description}:`);
    console.log(`   Input: ${JSON.stringify(testCase.input)}`);
    console.log(`   Output: ${result}`);
    console.log(`   Type: ${typeof testCase.input}`);
    if (testCase.input && typeof testCase.input === 'object') {
        console.log(`   Keys: ${Object.keys(testCase.input).join(', ')}`);
    }
    console.log('');
});

console.log('✅ Color display function test completed!');
console.log('\n💡 Expected behavior:');
console.log('   - String colors should display as-is');
console.log('   - Objects with .name should display the name');
console.log('   - Objects with .value should display the value');
console.log('   - Objects with .label should display the label');
console.log('   - Arrays should display the first item');
console.log('   - Invalid inputs should display "N/A"');

process.exit(0);
