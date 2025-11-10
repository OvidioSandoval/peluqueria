new Vue({
    el: '#app',
    data: {
        usuarios: [],
        usuariosFiltrados: [],
        filtroBusqueda: '',
        mostrarFormulario: false,
        editandoUsuario: false,
        usuarioForm: {
            id: null,
            nombre: '',
            email: '',
            telefono: '',
            rol: 'CLIENTE',
            password: '',
            activo: true
        }
    },
    mounted() {
        this.cargarUsuarios();
    },
    methods: {
        async cargarUsuarios() {
            try {
                const response = await fetch('/api/usuarios');
                this.usuarios = await response.json();
                this.usuariosFiltrados = [...this.usuarios];
            } catch (error) {
                console.error('Error al cargar usuarios:', error);
            }
        },
        
        filtrarUsuarios() {
            if (!this.filtroBusqueda) {
                this.usuariosFiltrados = [...this.usuarios];
                return;
            }
            
            const filtro = this.filtroBusqueda.toLowerCase();
            this.usuariosFiltrados = this.usuarios.filter(usuario =>
                usuario.nombre.toLowerCase().includes(filtro) ||
                usuario.email.toLowerCase().includes(filtro)
            );
        },
        
        async guardarUsuario() {
            try {
                const url = this.editandoUsuario ? `/api/usuarios/${this.usuarioForm.id}` : '/api/usuarios';
                const method = this.editandoUsuario ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.usuarioForm)
                });
                
                if (response.ok) {
                    await this.cargarUsuarios();
                    this.cerrarFormulario();
                    alert(this.editandoUsuario ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
                } else {
                    alert('Error al guardar usuario');
                }
            } catch (error) {
                console.error('Error al guardar usuario:', error);
                alert('Error al guardar usuario');
            }
        },
        
        editarUsuario(usuario) {
            this.editandoUsuario = true;
            this.usuarioForm = { ...usuario };
            this.mostrarFormulario = true;
        },
        
        async toggleEstadoUsuario(usuario) {
            try {
                const response = await fetch(`/api/usuarios/${usuario.id}/toggle-estado`, {
                    method: 'PUT'
                });
                
                if (response.ok) {
                    await this.cargarUsuarios();
                    alert(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente`);
                } else {
                    alert('Error al cambiar estado del usuario');
                }
            } catch (error) {
                console.error('Error al cambiar estado:', error);
                alert('Error al cambiar estado del usuario');
            }
        },
        
        async eliminarUsuario(id) {
            if (!confirm('¿Está seguro de que desea eliminar este usuario?')) {
                return;
            }
            
            try {
                const response = await fetch(`/api/usuarios/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    await this.cargarUsuarios();
                    alert('Usuario eliminado correctamente');
                } else {
                    alert('Error al eliminar usuario');
                }
            } catch (error) {
                console.error('Error al eliminar usuario:', error);
                alert('Error al eliminar usuario');
            }
        },
        
        cerrarFormulario() {
            this.mostrarFormulario = false;
            this.editandoUsuario = false;
            this.usuarioForm = {
                id: null,
                nombre: '',
                email: '',
                telefono: '',
                rol: 'CLIENTE',
                password: '',
                activo: true
            };
        },
        
        capitalizarTexto(texto) {
            if (!texto) return '';
            return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
        },
        
        formatearRol(rol) {
            const roles = {
                'ADMIN': 'Administrador',
                'EMPLEADO': 'Empleado',
                'CLIENTE': 'Cliente'
            };
            return roles[rol] || rol;
        },
        
        exportarPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.text('Lista de Usuarios', 20, 20);
            
            const headers = [['Nombre', 'Email', 'Teléfono', 'Rol', 'Estado']];
            const data = this.usuariosFiltrados.map(usuario => [
                this.capitalizarTexto(usuario.nombre),
                usuario.email,
                usuario.telefono || 'N/A',
                this.formatearRol(usuario.rol),
                usuario.activo ? 'Activo' : 'Inactivo'
            ]);
            
            doc.autoTable({
                head: headers,
                body: data,
                startY: 30,
                styles: {
                    fontSize: 10,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [139, 69, 19],
                    textColor: 255
                }
            });
            
            doc.save('usuarios.pdf');
        }
    }
});