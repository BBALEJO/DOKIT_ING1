// ==================== BASE DE DATOS LOCALSTORAGE ====================
let currentSelectedProjectId = null;

function initDB() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { email: 'lider@unilibre.edu.co', pass: '123', role: 'Lider', name: 'Prof. Lider Principal' },
            { email: 'profe@unilibre.edu.co', pass: '123', role: 'Profesor', name: 'Ing. Carlos Docente' },
            { email: 'semi@unilibre.edu.co', pass: '123', role: 'Semillerista', name: 'Breiner Bonilla' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem('projects')) {
        const defaultProjects = [
            { 
                id: 1, 
                name: 'Proyecto Robot Humanoide', 
                status: 'Creado', 
                startDate: '2026-06-01', 
                endDate: '2026-06-30', 
                members: ['semi@unilibre.edu.co', 'lider@unilibre.edu.co', 'profe@unilibre.edu.co'],
                photos: ['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'],
                comments: [{ user: 'Prof. Lider Principal', text: 'Inicio de la fase de acoplamiento estructural.' }]
            }
        ];
        localStorage.setItem('projects', JSON.stringify(defaultProjects));
    }

    if (!localStorage.getItem('tasks')) {
        const defaultTasks = [
            { id: 1, projectId: 1, name: 'Diseño de la estructura del Robot', sprint: 'Sprint 1', status: 'sin-empezar', priority: 'Alta', assignee: 'Juan Arévalo' },
            { id: 2, projectId: 1, name: 'Diseñar dashboard de control', sprint: 'Sprint 2', status: 'progreso', priority: 'Media', assignee: 'Breiner Bonilla' }
        ];
        localStorage.setItem('tasks', JSON.stringify(defaultTasks));
    }
}

// ==================== INITIALIZATION & EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('btn-logout');
    const profileForm = document.getElementById('profile-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            
            const users = JSON.parse(localStorage.getItem('users'));
            const user = users.find(u => u.email === email && u.pass === pass);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                document.getElementById('login-error').style.display = 'none';
                
                dashboardStartup();
                
                document.getElementById('login-view').classList.remove('active');
                document.getElementById('dashboard-view').classList.add('active');
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            document.getElementById('dashboard-view').classList.remove('active');
            document.getElementById('login-view').classList.add('active');
            document.getElementById('login-form').reset();
            document.getElementById('project-details-panel').style.display = 'none';
            switchView('proyectos', document.querySelector('.sidebar-nav li'));
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileData();
        });
    }
    
    if (localStorage.getItem('currentUser')) {
        dashboardStartup();
    }
});

function dashboardStartup() {
    applyRoleUI(); 
    renderProjects(); 
    renderTasks();
    renderSprintsTable();
    loadProfileData();
    populateProjectSelects();
}

function applyRoleUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    document.getElementById('ui-user-name').innerText = currentUser.name;
    document.getElementById('ui-user-role').innerText = currentUser.role;

    const actionButtons = document.querySelectorAll('.btn-action-lider');

    // Control estricto de visibilidad para creación de proyectos (Solo Líderes)
    if (currentUser.role === 'Lider') {
        actionButtons.forEach(btn => btn.style.display = 'inline-block');
    } else {
        actionButtons.forEach(btn => btn.style.display = 'none');
    }
}

// ==================== GESTIÓN DE PERFIL ====================
function loadProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const pName = document.getElementById('profile-name');
    const pEmail = document.getElementById('profile-email');
    const pPass = document.getElementById('profile-pass');

    if (pName) pName.value = currentUser.name;
    if (pEmail) pEmail.value = currentUser.email;
    if (pPass) pPass.value = currentUser.pass;
}

function saveProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let users = JSON.parse(localStorage.getItem('users')) || [];

    const newName = document.getElementById('profile-name').value;
    const newPass = document.getElementById('profile-pass').value;

    if (!newName || !newPass) return alert("Por favor complete todos los campos.");

    users = users.map(u => {
        if (u.email === currentUser.email) {
            return { ...u, name: newName, pass: newPass };
        }
        return u;
    });
    localStorage.setItem('users', JSON.stringify(users));

    currentUser.name = newName;
    currentUser.pass = newPass;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    applyRoleUI();
    alert("¡Perfil actualizado con éxito!");
}

// ==================== NAVEGACIÓN Y DRAWER ====================
function switchView(viewName, element) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) targetView.classList.add('active');

    if (element) {
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        element.classList.add('active');
    }
}

function toggleDrawer() {
    const drawer = document.getElementById('notification-drawer');
    const overlay = document.getElementById('drawer-overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        drawer.classList.add('open');
        overlay.classList.add('active');
    }
}

// ==================== CRUD Y EXPANSIÓN INTERACTIVA DE PROYECTOS ====================
function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    
    container.innerHTML = '';
    
    projects.forEach(proj => {
        let actionButtons = '';
        // Solo el Líder tiene el control de manipulación directa estructural en la tarjeta externa
        if (currentUser.role === 'Lider') {
            actionButtons = `
                <div class="project-actions" onclick="event.stopPropagation();">
                    <button class="btn-icon text-red" onclick="promptDeleteProject(${proj.id})"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-icon text-red" onclick="promptEditProject(${proj.id})"><i class="fa-solid fa-pen"></i></button>
                </div>
            `;
        }

        const projectImg = (proj.photos && proj.photos.length > 0) ? proj.photos[proj.photos.length - 1] : 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
        const projectStatus = proj.status || 'Creado';

        container.innerHTML += `
            <div class="project-card" onclick="expandProjectDetails(${proj.id})">
                <div class="project-img">
                    <img src="${projectImg}" alt="Robot">
                </div>
                <div class="project-info">
                    <h3>${proj.name}</h3>
                    <p style="font-size:0.8rem; margin-bottom:4px;">Estado: <b>${projectStatus}</b></p>
                    <span class="text-small">${proj.startDate || 'Sin fecha'} / ${proj.endDate || 'Sin fecha'}</span>
                </div>
                ${actionButtons}
            </div>
        `;
    });
}

function createProject() {
    const nameInput = document.getElementById('new-project-name').value;
    const startInput = document.getElementById('new-project-start').value;
    const endInput = document.getElementById('new-project-end').value;

    if (!nameInput || !startInput || !endInput) return alert("Por favor, ingrese el nombre y rango de fechas.");

    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    projects.push({ 
        id: Date.now(), 
        name: nameInput, 
        status: 'Creado',
        startDate: startInput, 
        endDate: endInput,
        members: [currentUser.email || 'lider@unilibre.edu.co'],
        photos: [],
        comments: []
    });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    document.getElementById('new-project-name').value = '';
    document.getElementById('new-project-start').value = '';
    document.getElementById('new-project-end').value = '';
    
    closeModal();
    renderProjects();
    renderSprintsTable();
    populateProjectSelects();
}

function promptEditProject(id) {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const proj = projects.find(p => p.id === id);
    if (!proj) return;

    document.getElementById('edit-project-id').value = proj.id;
    document.getElementById('edit-project-name').value = proj.name;
    openModal('modal-editar');
}

function saveEditProject() {
    const id = parseInt(document.getElementById('edit-project-id').value);
    const updatedName = document.getElementById('edit-project-name').value;
    if (!updatedName) return alert("El nombre no puede estar vacío");

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects = projects.map(p => p.id === id ? { ...p, name: updatedName } : p);

    localStorage.setItem('projects', JSON.stringify(projects));
    closeModal();
    renderProjects();
    populateProjectSelects();
    if(currentSelectedProjectId === id) expandProjectDetails(id);
}

function promptDeleteProject(id) {
    document.getElementById('delete-project-id').value = id;
    openModal('modal-eliminar');
}

function confirmDeleteProject() {
    const id = parseInt(document.getElementById('delete-project-id').value);
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    
    // Cambiar estado a Eliminado
    projects = projects.map(p => p.id === id ? { ...p, status: 'Eliminado' } : p);
    
    localStorage.setItem('projects', JSON.stringify(projects));
    closeModal();
    renderProjects();
    if(currentSelectedProjectId === id) expandProjectDetails(id);
}

// ==================== PANEL DE DETALLES EXTENDIDO (FOTOS, COMENTARIOS Y ESTADOS) ====================
function expandProjectDetails(id) {
    currentSelectedProjectId = id;
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const proj = projects.find(p => p.id === id);
    if (!proj) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    document.getElementById('detail-project-name').innerText = proj.name;
    document.getElementById('detail-project-status').innerText = proj.status || 'Creado';
    document.getElementById('change-project-status-select').value = proj.status || 'Creado';

    // Lista de integrantes asignados
    const membersList = document.getElementById('detail-members-list');
    membersList.innerHTML = '';
    if(proj.members) {
        proj.members.forEach(m => {
            membersList.innerHTML += `<li>${m}</li>`;
        });
    }

    // Renderizado de fotos
    const photosContainer = document.getElementById('detail-photos-container');
    photosContainer.innerHTML = '';
    if (proj.photos && proj.photos.length > 0) {
        proj.photos.forEach(imgUrl => {
            photosContainer.innerHTML += `<img src="${imgUrl}" style="width:75px; height:75px; object-fit:cover; border-radius:5px; border:1px solid #ccc;">`;
        });
    } else {
        photosContainer.innerHTML = '<small class="text-gray">No hay fotografías agregadas.</small>';
    }

    // Renderizado de la bitácora de comentarios
    const commentsContainer = document.getElementById('detail-comments-container');
    commentsContainer.innerHTML = '';
    if (proj.comments && proj.comments.length > 0) {
        proj.comments.forEach(c => {
            commentsContainer.innerHTML += `<p style="font-size:0.85rem; margin-bottom:5px;"><b>${c.user}:</b> ${c.text}</p>`;
        });
    } else {
        commentsContainer.innerHTML = '<small class="text-gray">Sin comentarios ni registros de bitácora.</small>';
    }

    // El Profesor y el Semillerista tienen bloqueada la adición de integrantes con correo
    const memberActionsDiv = document.querySelector('.btn-action-add-member');
    if (currentUser.role === 'Profesor' || currentUser.role === 'Semillerista') {
        if(memberActionsDiv) memberActionsDiv.style.display = 'none';
    } else {
        if(memberActionsDiv) memberActionsDiv.style.display = 'block';
    }

    document.getElementById('project-details-panel').style.display = 'block';
    document.getElementById('project-details-panel').scrollIntoView({ behavior: 'smooth' });
}

function updateProjectStatusState() {
    if (!currentSelectedProjectId) return;
    const selectedState = document.getElementById('change-project-status-select').value;
    
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects = projects.map(p => p.id === currentSelectedProjectId ? { ...p, status: selectedState } : p);
    
    localStorage.setItem('projects', JSON.stringify(projects));
    renderProjects();
    expandProjectDetails(currentSelectedProjectId);
}

function addMemberToProject() {
    if (!currentSelectedProjectId) return;
    const emailInput = document.getElementById('add-member-email').value;
    if (!emailInput) return alert("Ingrese un correo válido");

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects = projects.map(p => {
        if (p.id === currentSelectedProjectId) {
            const members = p.members || [];
            if (!members.includes(emailInput)) {
                members.push(emailInput);
            }
            return { ...p, members };
        }
        return p;
    });

    localStorage.setItem('projects', JSON.stringify(projects));
    document.getElementById('add-member-email').value = '';
    expandProjectDetails(currentSelectedProjectId);
}

function uploadProjectPhoto() {
    if (!currentSelectedProjectId) return;
    const url = document.getElementById('project-photo-url').value;
    if (!url) return alert("Inserte una URL válida");

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects = projects.map(p => {
        if (p.id === currentSelectedProjectId) {
            const photos = p.photos || [];
            photos.push(url);
            return { ...p, photos };
        }
        return p;
    });

    localStorage.setItem('projects', JSON.stringify(projects));
    document.getElementById('project-photo-url').value = '';
    expandProjectDetails(currentSelectedProjectId);
    renderProjects();
}

function addProjectComment() {
    if (!currentSelectedProjectId) return;
    const commentText = document.getElementById('project-comment-text').value;
    if (!commentText) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Usuario' };
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    
    projects = projects.map(p => {
        if (p.id === currentSelectedProjectId) {
            const comments = p.comments || [];
            comments.push({ user: currentUser.name, text: commentText });
            return { ...p, comments };
        }
        return p;
    });

    localStorage.setItem('projects', JSON.stringify(projects));
    document.getElementById('project-comment-text').value = '';
    expandProjectDetails(currentSelectedProjectId);
}

// ==================== AUTO GENERACIÓN DE SPRINTS DINÁMICOS ====================
function renderSprintsTable() {
    const tbody = document.getElementById('sprints-table-body');
    if (!tbody) return;
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    tbody.innerHTML = '';

    projects.forEach(p => {
        const start = p.startDate ? new Date(p.startDate) : new Date();
        const end = p.endDate ? new Date(p.endDate) : new Date();
        
        // El Sprint 1 toma la primera mitad de tiempo, Sprint 2 toma la segunda mitad
        const midTime = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
        
        const fStartStr = start.toLocaleDateString('es-CO');
        const fMidStr = midTime.toLocaleDateString('es-CO');
        const fEndStr = end.toLocaleDateString('es-CO');

        tbody.innerHTML += `
            <tr>
                <td><b>${p.name}</b></td>
                <td>Sprint 1</td>
                <td>${fStartStr} - ${fMidStr}</td>
                <td><span class="badge gray">Vigente</span></td>
            </tr>
            <tr>
                <td><b>${p.name}</b></td>
                <td>Sprint 2</td>
                <td>${fMidStr} - ${fEndStr}</td>
                <td><span class="badge gray">Planeado</span></td>
            </tr>
        `;
    });
}

// ==================== SECCIÓN TAREAS ASOCIADAS A PROYECTOS ====================
function populateProjectSelects() {
    const filterSelect = document.getElementById('filter-task-project');
    const modalSelect = document.getElementById('task-project-select');
    const projects = JSON.parse(localStorage.getItem('projects')) || [];

    if (filterSelect) {
        filterSelect.innerHTML = '<option value="all">Todos los proyectos</option>';
        projects.forEach(p => {
            filterSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    }

    if (modalSelect) {
        modalSelect.innerHTML = '';
        projects.forEach(p => {
            modalSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    }
}

function renderTasks() {
    const tbody = document.getElementById('tasks-table-body');
    if (!tbody) return;
    
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const filterValue = document.getElementById('filter-task-project') ? document.getElementById('filter-task-project').value : 'all';

    tbody.innerHTML = '';

    const filteredTasks = filterValue === 'all' ? tasks : tasks.filter(t => t.projectId == filterValue);

    filteredTasks.forEach(t => {
        const matchingProject = projects.find(p => p.id == t.projectId);
        const projectName = matchingProject ? matchingProject.name : 'Proyecto General';
        
        const statusSelected = (val) => t.status === val ? 'selected' : '';
        const badgeColor = t.priority === 'Alta' ? 'red' : 'gray';

        tbody.innerHTML += `
            <tr>
                <td>${t.id}</td>
                <td><small><b>${projectName}</b></small></td>
                <td>${t.name}</td>
                <td>${t.sprint}</td>
                <td>
                    <select class="status-select ${getStatusClass(t.status)}" onchange="updateTaskStatusData(${t.id}, this)">
                        <option value="sin-empezar" ${statusSelected('sin-empezar')}>Sin empezar</option>
                        <option value="progreso" ${statusSelected('progreso')}>En progreso</option>
                        <option value="completada" ${statusSelected('completada')}>Completada</option>
                    </select>
                </td>
                <td><span class="badge ${badgeColor}">${t.priority}</span></td>
                <td>${t.assignee}</td>
            </tr>
        `;
    });
}

function getStatusClass(status) {
    if (status === 'sin-empezar') return 'status-gray';
    if (status === 'progreso') return 'status-yellow';
    if (status === 'completada') return 'status-green';
    return 'status-gray';
}

function updateTaskStatusData(taskId, selectElement) {
    changeStatus(selectElement);
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.map(t => t.id === taskId ? { ...t, status: selectElement.value } : t);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function createNewTaskData() {
    const projId = parseInt(document.getElementById('task-project-select').value);
    const name = document.getElementById('task-name').value;
    const sprint = document.getElementById('task-sprint-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const assignee = document.getElementById('task-assignee').value;

    if (!name || !assignee) return alert("Complete los datos de la tarea.");

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({
        id: Date.now(),
        projectId: projId,
        name: name,
        sprint: sprint,
        status: 'sin-empezar',
        priority: priority,
        assignee: assignee
    });

    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    document.getElementById('task-name').value = '';
    document.getElementById('task-assignee').value = '';
    
    closeModal();
    renderTasks();
}

// ==================== MODALES COMPLEMENTOS ====================
function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    if (overlay && modal) {
        overlay.classList.add('active');
        document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
        modal.classList.add('active');
    }
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
    }
}
