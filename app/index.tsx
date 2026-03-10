import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { db, initDB } from '../database';

type Programa = { codigo: string; nombre: string };

export default function ProgramasScreen() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    initDB();
    cargarProgramas();
  }, []);

  const cargarProgramas = (termino = '') => {
    let result;
    if (termino) {
      result = db.getAllSync<Programa>(
        'SELECT * FROM programas WHERE codigo LIKE ? OR nombre LIKE ?',
        [`%${termino}%`, `%${termino}%`]
      );
    } else {
      result = db.getAllSync<Programa>('SELECT * FROM programas');
    }
    setProgramas(result);
  };

  const guardarPrograma = () => {
    if (!codigo || !nombre) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    try {
      if (editando) {
        // Solo actualizamos el nombre como lo solicitaste
        db.runSync('UPDATE programas SET nombre = ? WHERE codigo = ?', [nombre, codigo]);
        setEditando(false);
      } else {
        db.runSync('INSERT INTO programas (codigo, nombre) VALUES (?, ?)', [codigo, nombre]);
      }
      setCodigo('');
      setNombre('');
      cargarProgramas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar. Revisa que el código no esté duplicado y cumpla el límite.');
    }
  };

  const editarPrograma = (prog: Programa) => {
    setCodigo(prog.codigo);
    setNombre(prog.nombre);
    setEditando(true);
  };

  const eliminarPrograma = (cod: string) => {
    Alert.alert('Confirmar', '¿Seguro que deseas eliminar este programa?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          db.runSync('DELETE FROM programas WHERE codigo = ?', [cod]);
          cargarProgramas();
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Programas</Text>

      {/* Navegación a Estudiantes */}
      <Link href="/estudiantes" asChild>
        <Button title="Ir a Estudiantes ->" color="#007BFF" />
      </Link>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, editando && styles.disabledInput]}
          placeholder="Código (Ej: P001)"
          value={codigo}
          onChangeText={setCodigo}
          maxLength={4}
          editable={!editando} // No se puede editar el código si ya existe
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre del Programa"
          value={nombre}
          onChangeText={setNombre}
          maxLength={30}
        />
        <Button title={editando ? "Actualizar Nombre" : "Crear Programa"} onPress={guardarPrograma} />
        {editando && <Button title="Cancelar Edición" color="red" onPress={() => { setEditando(false); setCodigo(''); setNombre(''); }} />}
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por código o nombre..."
        value={busqueda}
        onChangeText={(text) => {
          setBusqueda(text);
          cargarProgramas(text);
        }}
      />

      <FlatList
        data={programas}
        keyExtractor={(item) => item.codigo}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>[{item.codigo}] {item.nombre}</Text>
            </View>
            <TouchableOpacity onPress={() => editarPrograma(item)}>
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => eliminarPrograma(item.codigo)}>
              <Text style={[styles.actionText, { color: 'red' }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  form: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginVertical: 15, gap: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
  disabledInput: { backgroundColor: '#e0e0e0', color: '#888' },
  searchInput: { borderWidth: 1, borderColor: '#007BFF', padding: 10, borderRadius: 5, marginBottom: 15, backgroundColor: 'white' },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 5, marginBottom: 10, alignItems: 'center', gap: 10 },
  actionText: { color: '#007BFF', fontWeight: 'bold' }
});