import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

interface LoginResponse {
    success: boolean;
    data: {
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    };
}

interface CategoryResponse {
    success: boolean;
    message: string;
    data?: any;
    total?: number;
}

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCategoryPermissions() {
    try {
        log('\n========================================', 'cyan');
        log('PRUEBA DE PERMISOS DE CATEGORÍAS', 'cyan');
        log('========================================\n', 'cyan');

        // Variables para almacenar tokens
        let adminToken = '';
        let userToken = '';
        let user2Token = '';

        // ========================================
        // 1. LOGIN COMO ADMINISTRADOR
        // ========================================
        log('1. Intentando login como administrador...', 'blue');
        try {
            const adminLogin = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
                email: 'admin@monetix.com',
                password: 'Admin123!',
            });
            adminToken = adminLogin.data.data.token;
            log(`✓ Login exitoso como: ${adminLogin.data.data.user.name} (${adminLogin.data.data.user.role})`, 'green');
        } catch (error: any) {
            log(`✗ Error en login de admin: ${error.response?.data?.message || error.message}`, 'red');
            log('Asegúrate de tener un usuario admin en la base de datos', 'yellow');
            return;
        }

        // ========================================
        // 2. LOGIN COMO USUARIO REGULAR 1
        // ========================================
        log('\n2. Intentando login como usuario regular 1...', 'blue');
        try {
            const userLogin = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
                email: 'user@monetix.com',
                password: 'User123!',
            });
            userToken = userLogin.data.data.token;
            log(`✓ Login exitoso como: ${userLogin.data.data.user.name} (${userLogin.data.data.user.role})`, 'green');
        } catch (error: any) {
            log(`✗ Error en login de usuario 1: ${error.response?.data?.message || error.message}`, 'red');
            log('Asegúrate de tener un usuario regular en la base de datos', 'yellow');
            return;
        }

        // ========================================
        // 3. LOGIN COMO USUARIO REGULAR 2
        // ========================================
        log('\n3. Intentando login como usuario regular 2...', 'blue');
        try {
            const user2Login = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
                email: 'user2@monetix.com',
                password: 'User123!',
            });
            user2Token = user2Login.data.data.token;
            log(`✓ Login exitoso como: ${user2Login.data.data.user.name} (${user2Login.data.data.user.role})`, 'green');
        } catch (error: any) {
            log(`✗ Error en login de usuario 2: ${error.response?.data?.message || error.message}`, 'red');
            log('Continuando con solo un usuario regular...', 'yellow');
        }

        // ========================================
        // 4. ADMIN CREA CATEGORÍA DEL SISTEMA
        // ========================================
        log('\n4. Admin creando categoría del sistema "Salario"...', 'blue');
        let adminCategoryId = '';
        try {
            const adminCategory = await axios.post<CategoryResponse>(
                `${API_URL}/categories`,
                {
                    name: 'Salario Test',
                    type: 'income',
                    icon: '💰',
                    color: '#4CAF50',
                    description: 'Categoría del sistema creada por admin',
                },
                {
                    headers: { Authorization: `Bearer ${adminToken}` },
                }
            );
            adminCategoryId = adminCategory.data.data._id;
            log(`✓ ${adminCategory.data.message}`, 'green');
            log(`  - ID: ${adminCategory.data.data._id}`, 'green');
            log(`  - isDefault: ${adminCategory.data.data.isDefault}`, 'green');
            log(`  - userId: ${adminCategory.data.data.userId || 'null (sistema)'}`, 'green');
        } catch (error: any) {
            log(`✗ Error: ${error.response?.data?.message || error.message}`, 'red');
        }

        // ========================================
        // 5. USUARIO 1 CREA CATEGORÍA PERSONAL
        // ========================================
        log('\n5. Usuario 1 creando categoría personal "Freelance"...', 'blue');
        let user1CategoryId = '';
        try {
            const userCategory = await axios.post<CategoryResponse>(
                `${API_URL}/categories`,
                {
                    name: 'Freelance Test',
                    type: 'income',
                    icon: '💻',
                    color: '#2196F3',
                    description: 'Categoría personal del usuario 1',
                },
                {
                    headers: { Authorization: `Bearer ${userToken}` },
                }
            );
            user1CategoryId = userCategory.data.data._id;
            log(`✓ ${userCategory.data.message}`, 'green');
            log(`  - ID: ${userCategory.data.data._id}`, 'green');
            log(`  - isDefault: ${userCategory.data.data.isDefault}`, 'green');
            log(`  - userId: ${userCategory.data.data.userId || 'null'}`, 'green');
        } catch (error: any) {
            log(`✗ Error: ${error.response?.data?.message || error.message}`, 'red');
        }

        // ========================================
        // 6. USUARIO 1 VE SUS CATEGORÍAS
        // ========================================
        log('\n6. Usuario 1 listando sus categorías...', 'blue');
        try {
            const user1Categories = await axios.get<CategoryResponse>(`${API_URL}/categories`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            log(`✓ Total de categorías visibles: ${user1Categories.data.total}`, 'green');

            const systemCategories = user1Categories.data.data.filter((c: any) => c.isDefault);
            const personalCategories = user1Categories.data.data.filter((c: any) => !c.isDefault);

            log(`  - Categorías del sistema: ${systemCategories.length}`, 'green');
            log(`  - Categorías personales: ${personalCategories.length}`, 'green');

            const hasSalario = user1Categories.data.data.some((c: any) => c.name === 'Salario Test');
            const hasFreelance = user1Categories.data.data.some((c: any) => c.name === 'Freelance Test');

            if (hasSalario) {
                log(`  ✓ Puede ver "Salario Test" (categoría del sistema)`, 'green');
            } else {
                log(`  ✗ NO puede ver "Salario Test" (ERROR)`, 'red');
            }

            if (hasFreelance) {
                log(`  ✓ Puede ver "Freelance Test" (su categoría personal)`, 'green');
            } else {
                log(`  ✗ NO puede ver "Freelance Test" (ERROR)`, 'red');
            }
        } catch (error: any) {
            log(`✗ Error: ${error.response?.data?.message || error.message}`, 'red');
        }

        // ========================================
        // 7. USUARIO 2 VE SUS CATEGORÍAS
        // ========================================
        if (user2Token) {
            log('\n7. Usuario 2 listando sus categorías...', 'blue');
            try {
                const user2Categories = await axios.get<CategoryResponse>(`${API_URL}/categories`, {
                    headers: { Authorization: `Bearer ${user2Token}` },
                });
                log(`✓ Total de categorías visibles: ${user2Categories.data.total}`, 'green');

                const hasSalario = user2Categories.data.data.some((c: any) => c.name === 'Salario Test');
                const hasFreelance = user2Categories.data.data.some((c: any) => c.name === 'Freelance Test');

                if (hasSalario) {
                    log(`  ✓ Puede ver "Salario Test" (categoría del sistema)`, 'green');
                } else {
                    log(`  ✗ NO puede ver "Salario Test" (ERROR)`, 'red');
                }

                if (!hasFreelance) {
                    log(`  ✓ NO puede ver "Freelance Test" (categoría de otro usuario)`, 'green');
                } else {
                    log(`  ✗ Puede ver "Freelance Test" de otro usuario (ERROR)`, 'red');
                }
            } catch (error: any) {
                log(`✗ Error: ${error.response?.data?.message || error.message}`, 'red');
            }
        }

        // ========================================
        // 8. USUARIO INTENTA MODIFICAR CATEGORÍA DEL SISTEMA
        // ========================================
        if (adminCategoryId) {
            log('\n8. Usuario 1 intentando modificar categoría del sistema...', 'blue');
            try {
                await axios.put<CategoryResponse>(
                    `${API_URL}/categories/${adminCategoryId}`,
                    { name: 'Salario Modificado' },
                    { headers: { Authorization: `Bearer ${userToken}` } }
                );
                log(`✗ Usuario pudo modificar categoría del sistema (ERROR)`, 'red');
            } catch (error: any) {
                if (error.response?.status === 404 || error.response?.status === 403) {
                    log(`✓ Usuario NO puede modificar categoría del sistema (correcto)`, 'green');
                } else {
                    log(`? Error inesperado: ${error.response?.data?.message || error.message}`, 'yellow');
                }
            }
        }

        // ========================================
        // 9. LIMPIEZA - ELIMINAR CATEGORÍAS DE PRUEBA
        // ========================================
        log('\n9. Limpiando categorías de prueba...', 'blue');

        if (adminCategoryId) {
            try {
                await axios.delete(`${API_URL}/categories/${adminCategoryId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` },
                });
                log(`✓ Categoría "Salario Test" eliminada`, 'green');
            } catch (error: any) {
                log(`✗ Error al eliminar "Salario Test": ${error.response?.data?.message || error.message}`, 'red');
            }
        }

        if (user1CategoryId) {
            try {
                await axios.delete(`${API_URL}/categories/${user1CategoryId}`, {
                    headers: { Authorization: `Bearer ${userToken}` },
                });
                log(`✓ Categoría "Freelance Test" eliminada`, 'green');
            } catch (error: any) {
                log(`✗ Error al eliminar "Freelance Test": ${error.response?.data?.message || error.message}`, 'red');
            }
        }

        log('\n========================================', 'cyan');
        log('PRUEBAS COMPLETADAS', 'cyan');
        log('========================================\n', 'cyan');

    } catch (error: any) {
        log(`\n✗ Error general: ${error.message}`, 'red');
        console.error(error);
    }
}

// Ejecutar las pruebas
testCategoryPermissions();
