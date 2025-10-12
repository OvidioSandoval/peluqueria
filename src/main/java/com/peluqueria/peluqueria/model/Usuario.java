package com.peluqueria.peluqueria.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    @NotBlank
    private String username;
    
    @Column(nullable = false)
    @NotBlank
    private String password;
    
    @Email
    private String correo;
    
    @Column(nullable = false)
    private Boolean activo = true;
    
    @ManyToOne
    @JoinColumn(name = "rol_id")
    private Rol rol;
    
    public Usuario() {}
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    
    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }
}