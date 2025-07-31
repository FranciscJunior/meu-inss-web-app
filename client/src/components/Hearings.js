import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';

const Hearings = () => {
  const [hearings, setHearings] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalHearings, setTotalHearings] = useState(0);

  const [formData, setFormData] = useState({
    process_id: '',
    date: '',
    time: '',
    location: '',
    type: '',
    status: 'agendada',
    observations: ''
  });

  useEffect(() => {
    fetchHearings();
    fetchProcesses();
  }, [page, rowsPerPage, dateFilter, statusFilter]);

  const fetchHearings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/hearings', {
        params: {
          date: dateFilter,
          status: statusFilter,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setHearings(response.data.hearings);
      setTotalHearings(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao buscar audiências:', error);
      setError('Erro ao carregar audiências');
    } finally {
      setLoading(false);
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await axios.get('/api/processes', { params: { limit: 1000 } });
      setProcesses(response.data.processes);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
    }
  };

  const handleOpenDialog = (hearing = null) => {
    if (hearing) {
      setEditingHearing(hearing);
      setFormData(hearing);
    } else {
      setEditingHearing(null);
      setFormData({
        process_id: '',
        date: '',
        time: '',
        location: '',
        type: '',
        status: 'agendada',
        observations: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHearing(null);
    setFormData({
      process_id: '',
      date: '',
      time: '',
      location: '',
      type: '',
      status: 'agendada',
      observations: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingHearing) {
        await axios.put(`/api/hearings/${editingHearing.id}`, formData);
      } else {
        await axios.post('/api/hearings', formData);
      }
      handleCloseDialog();
      fetchHearings();
    } catch (error) {
      console.error('Erro ao salvar audiência:', error);
      setError(error.response?.data?.error || 'Erro ao salvar audiência');
    }
  };

  const handleDelete = async (hearingId) => {
    if (window.confirm('Tem certeza que deseja deletar esta audiência?')) {
      try {
        await axios.delete(`/api/hearings/${hearingId}`);
        fetchHearings();
      } catch (error) {
        console.error('Erro ao deletar audiência:', error);
        setError(error.response?.data?.error || 'Erro ao deletar audiência');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'agendada': return 'primary';
      case 'realizada': return 'success';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'agendada': return 'Agendada';
      case 'realizada': return 'Realizada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Audiências</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Audiência
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="agendada">Agendada</MenuItem>
                  <MenuItem value="realizada">Realizada</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Horário</TableCell>
              <TableCell>Processo</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Local</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : hearings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhuma audiência encontrada
                </TableCell>
              </TableRow>
            ) : (
              hearings.map((hearing) => (
                <TableRow key={hearing.id}>
                  <TableCell>{formatDate(hearing.date)}</TableCell>
                  <TableCell>{formatTime(hearing.time)}</TableCell>
                  <TableCell>{hearing.process_number}</TableCell>
                  <TableCell>{hearing.client_name}</TableCell>
                  <TableCell>{hearing.location}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(hearing.status)}
                      color={getStatusColor(hearing.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(hearing)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(hearing.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalHearings}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingHearing ? 'Editar Audiência' : 'Nova Audiência'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Processo</InputLabel>
                <Select
                  value={formData.process_id}
                  label="Processo"
                  onChange={(e) => setFormData({ ...formData, process_id: e.target.value })}
                >
                  {processes.map((process) => (
                    <MenuItem key={process.id} value={process.id}>
                      {process.process_number} - {process.client_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Horário"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="agendada">Agendada</MenuItem>
                  <MenuItem value="realizada">Realizada</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Local"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tipo"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingHearing ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Hearings; 