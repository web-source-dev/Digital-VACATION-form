import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import axios from 'axios';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/vacation-requests`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleAction = async (booking, status) => {
    if (status === 'rejected') {
      setSelectedBooking(booking);
      setDialogOpen(true);
    } else {
      await updateBookingStatus(booking._id, status);
    }
  };

  const handleReject = async () => {
    if (selectedBooking) {
      await updateBookingStatus(selectedBooking._id, 'rejected', rejectionReason);
      setDialogOpen(false);
      setRejectionReason('');
      setSelectedBooking(null);
    }
  };

  const updateBookingStatus = async (bookingId, status, reason = '') => {
    try {
      setActionError('');
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/vacation-requests/${bookingId}`,
        {
          status,
          rejectionReason: reason
        }
      );
      fetchBookings();
      return true;
    } catch (error) {
      setActionError(error.response?.data?.message || 'Error updating booking status');
      return false;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vacation Requests
      </Typography>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Clinic</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Days</TableCell>
            <TableCell>Remaining Days</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.map((booking) => {
            const start = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            const remainingDays = booking.employeeId.annualVacationDays - booking.employeeId.usedVacationDays;

            return (
              <TableRow key={booking._id}>
                <TableCell>{booking.employeeId.name}</TableCell>
                <TableCell>{booking.clinic}</TableCell>
                <TableCell>{booking.department}</TableCell>
                <TableCell>{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(booking.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{days}</TableCell>
                <TableCell>{remainingDays}</TableCell>
                <TableCell>{booking.status}</TableCell>
                <TableCell>
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        color="primary"
                        onClick={() => handleAction(booking, 'approved')}
                        disabled={days > remainingDays}
                        title={days > remainingDays ? 'Not enough vacation days remaining' : ''}
                      >
                        Approve
                      </Button>
                      <Button
                        color="error"
                        onClick={() => handleAction(booking, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Reject Vacation Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            margin="normal"
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 