const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let userId = '';

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    endpoints: []
};

async function testEndpoint(method, path, data = null, headers = {}, description = '') {
    results.total++;
    const fullUrl = `${BASE_URL}${path}`;

    try {
        const config = {
            method,
            url: fullUrl,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);

        results.passed++;
        results.endpoints.push({
            method,
            path,
            status: response.status,
            success: true,
            description,
            response: response.data
        });

        console.log(`${colors.green}✓${colors.reset} ${method.padEnd(6)} ${path.padEnd(50)} ${colors.green}${response.status}${colors.reset} - ${description}`);
        return response.data;
    } catch (error) {
        const status = error.response?.status || 'ERROR';
        const message = error.response?.data?.message || error.message;

        results.failed++;
        results.endpoints.push({
            method,
            path,
            status,
            success: false,
            description,
            error: message
        });

        console.log(`${colors.red}✗${colors.reset} ${method.padEnd(6)} ${path.padEnd(50)} ${colors.red}${status}${colors.reset} - ${message}`);
        return null;
    }
}

async function runTests() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}         MONETIX BACKEND - COMPREHENSIVE ENDPOINT TESTING${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

    // ============ AUTH ENDPOINTS ============
    console.log(`\n${colors.blue}▶ AUTH ENDPOINTS (3)${colors.reset}`);

    // 1. Register
    const registerData = await testEndpoint('POST', '/auth/register', {
        email: `testuser${Date.now()}@test.com`,
        password: 'Test123456',
        name: 'Test User'
    }, {}, 'Register new user');

    // 2. Login
    const loginData = await testEndpoint('POST', '/auth/login', {
        email: 'test@monetix.com',
        password: 'Test123456'
    }, {}, 'Login with test user');

    if (loginData && loginData.token) {
        authToken = loginData.token;
        userId = loginData.user.id;
        console.log(`${colors.yellow}   → Token obtained: ${authToken.substring(0, 20)}...${colors.reset}`);
    }

    // 3. Get current user
    await testEndpoint('GET', '/auth/me', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get current user');

    // ============ CATEGORY ENDPOINTS ============
    console.log(`\n${colors.blue}▶ CATEGORY ENDPOINTS (6)${colors.reset}`);

    // 4. Get all categories
    await testEndpoint('GET', '/categories', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get all categories');

    // 5. Get category stats
    await testEndpoint('GET', '/categories/stats', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get category statistics');

    // 6. Create category
    const newCategory = await testEndpoint('POST', '/categories', {
        name: 'Test Category',
        type: 'expense',
        icon: '🧪'
    }, {
        'Authorization': `Bearer ${authToken}`
    }, 'Create custom category');

    let categoryId = newCategory?.data?.id;

    // 7. Get category by ID
    if (categoryId) {
        await testEndpoint('GET', `/categories/${categoryId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Get category by ID');

        // 8. Update category
        await testEndpoint('PUT', `/categories/${categoryId}`, {
            name: 'Updated Test Category'
        }, {
            'Authorization': `Bearer ${authToken}`
        }, 'Update category');

        // 9. Delete category
        await testEndpoint('DELETE', `/categories/${categoryId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Delete category');
    }

    // ============ TRANSACTION ENDPOINTS ============
    console.log(`\n${colors.blue}▶ TRANSACTION ENDPOINTS (8)${colors.reset}`);

    // 10. Get all transactions
    await testEndpoint('GET', '/transactions', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get all transactions');

    // 11. Get transaction statistics
    await testEndpoint('GET', '/transactions/statistics', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get transaction statistics');

    // 12. Get transactions by category
    await testEndpoint('GET', '/transactions/by-category', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get transactions by category');

    // 13. Get transactions by period
    await testEndpoint('GET', '/transactions/by-period', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get transactions by period');

    // 14. Create transaction
    const newTransaction = await testEndpoint('POST', '/transactions', {
        amount: 100.50,
        type: 'expense',
        category: '507f1f77bcf86cd799439011',
        description: 'Test transaction',
        date: new Date().toISOString()
    }, {
        'Authorization': `Bearer ${authToken}`
    }, 'Create transaction');

    let transactionId = newTransaction?.data?.id;

    // 15. Get transaction by ID
    if (transactionId) {
        await testEndpoint('GET', `/transactions/${transactionId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Get transaction by ID');

        // 16. Update transaction
        await testEndpoint('PUT', `/transactions/${transactionId}`, {
            amount: 150.75
        }, {
            'Authorization': `Bearer ${authToken}`
        }, 'Update transaction');

        // 17. Delete transaction
        await testEndpoint('DELETE', `/transactions/${transactionId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Delete transaction');
    }

    // ============ GOAL ENDPOINTS ============
    console.log(`\n${colors.blue}▶ GOAL ENDPOINTS (7)${colors.reset}`);

    // 18. Get all goals
    await testEndpoint('GET', '/goals', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get all goals');

    // 19. Create goal
    const newGoal = await testEndpoint('POST', '/goals', {
        name: 'Test Goal',
        targetAmount: 5000,
        currentAmount: 1000,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }, {
        'Authorization': `Bearer ${authToken}`
    }, 'Create goal');

    let goalId = newGoal?.data?.id;

    // 20. Get goal by ID
    if (goalId) {
        await testEndpoint('GET', `/goals/${goalId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Get goal by ID');

        // 21. Get goal projection
        await testEndpoint('GET', `/goals/${goalId}/projection`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Get goal projection');

        // 22. Update goal
        await testEndpoint('PUT', `/goals/${goalId}`, {
            name: 'Updated Test Goal'
        }, {
            'Authorization': `Bearer ${authToken}`
        }, 'Update goal');

        // 23. Update goal progress
        await testEndpoint('PUT', `/goals/${goalId}/progress`, {
            currentAmount: 2000
        }, {
            'Authorization': `Bearer ${authToken}`
        }, 'Update goal progress');

        // 24. Delete goal
        await testEndpoint('DELETE', `/goals/${goalId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Delete goal');
    }

    // ============ PREDICTION ENDPOINTS ============
    console.log(`\n${colors.blue}▶ PREDICTION ENDPOINTS (3)${colors.reset}`);

    // 25. Generate prediction
    const prediction = await testEndpoint('POST', '/predictions/generate', {
        modelType: 'linear_regression',
        periods: 6
    }, {
        'Authorization': `Bearer ${authToken}`
    }, 'Generate prediction');

    // 26. Get predictions
    await testEndpoint('GET', '/predictions', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get all predictions');

    // 27. Get insights
    await testEndpoint('GET', '/predictions/insights', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get financial insights');

    // ============ COMPARISON ENDPOINTS ============
    console.log(`\n${colors.blue}▶ COMPARISON ENDPOINTS (5)${colors.reset}`);

    // 28. Compare by category
    await testEndpoint('GET', '/comparisons/category', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Compare by category');

    // 29. Compare temporal
    await testEndpoint('GET', '/comparisons/temporal', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Compare temporal predictions');

    // 30. Compare by periods
    await testEndpoint('POST', '/comparisons/periods', {
        periods: [3, 6, 12]
    }, {
        'Authorization': `Bearer ${authToken}`
    }, 'Compare by periods');

    let predictionId = prediction?.data?.id;

    // 31. Compare real vs predicted
    if (predictionId) {
        await testEndpoint('GET', `/comparisons/real-vs-predicted/${predictionId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Compare real vs predicted');
    }

    // 32. Compare users (admin only - will fail for regular user)
    await testEndpoint('POST', '/comparisons/users', {
        userIds: [userId]
    }, {
        'Authorization': `Bearer ${authToken}`
    }, 'Compare users (admin only)');

    // ============ ALERT ENDPOINTS ============
    console.log(`\n${colors.blue}▶ ALERT ENDPOINTS (7)${colors.reset}`);

    // 33. Generate alerts
    await testEndpoint('POST', '/alerts/generate', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Generate alerts');

    // 34. Get all alerts
    const alerts = await testEndpoint('GET', '/alerts', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get all alerts');

    // 35. Get unread count
    await testEndpoint('GET', '/alerts/unread-count', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Get unread alert count');

    let alertId = alerts?.data?.[0]?.id;

    // 36. Get alert by ID
    if (alertId) {
        await testEndpoint('GET', `/alerts/${alertId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Get alert by ID');

        // 37. Mark alert as read
        await testEndpoint('PUT', `/alerts/${alertId}/read`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Mark alert as read');
    }

    // 38. Mark all as read
    await testEndpoint('PUT', '/alerts/read-all', null, {
        'Authorization': `Bearer ${authToken}`
    }, 'Mark all alerts as read');

    // 39. Delete alert
    if (alertId) {
        await testEndpoint('DELETE', `/alerts/${alertId}`, null, {
            'Authorization': `Bearer ${authToken}`
        }, 'Delete alert');
    }

    // ============ SUMMARY ============
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                         TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`Total Endpoints Tested: ${results.total}`);
    console.log(`${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${results.failed}${colors.reset}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`);

    // Save results to file
    const fs = require('fs');
    fs.writeFileSync('endpoint-test-results.json', JSON.stringify(results, null, 2));
    console.log(`${colors.yellow}Results saved to: endpoint-test-results.json${colors.reset}\n`);
}

// Run tests
runTests().catch(console.error);
