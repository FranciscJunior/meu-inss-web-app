import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardMedia, CardActions, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Alert, CircularProgress, Paper
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PhotoCamera as PhotoIcon
} from '@mui/icons-material';
import axios from 'axios';

const Galeria = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/galeria');
      setPhotos(response.data.photos);
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
      setError('Erro ao carregar galeria');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (filename) => {
    if (!window.confirm('Tem certeza que deseja deletar esta foto?')) {
      return;
    }

    try {
      await axios.delete(`/api/galeria/${filename}`);
      setPhotos(photos.filter(photo => photo.filename !== filename));
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      setError('Erro ao deletar foto');
    }
  };

  const handleViewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setViewDialog(true);
  };

  const handleCloseDialog = () => {
    setViewDialog(false);
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📸 Galeria de Fotos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {photos.length} foto{photos.length !== 1 ? 's' : ''} na galeria
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {photos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PhotoIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Galeria Vazia
          </Typography>
          <Typography variant="body2" color="text.secondary">
            As fotos dos clientes aparecerão aqui quando forem enviadas
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={photo.filename}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={photo.url}
                  alt="Foto do cliente"
                  sx={{ objectFit: 'cover' }}
                />
                <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(photo.createdAt).toLocaleDateString('pt-BR')}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleViewPhoto(photo)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePhoto(photo.filename)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para visualizar foto */}
      <Dialog open={viewDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Visualizar Foto</DialogTitle>
        <DialogContent>
          {selectedPhoto && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={selectedPhoto.url}
                alt="Foto do cliente"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Enviada em: {new Date(selectedPhoto.createdAt).toLocaleString('pt-BR')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Galeria; 