const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const router = express.Router();

const APP_ID = 'e6763f01e6344d418daa06bf25ad459f';
const APP_CERTIFICATE = '3924365ad07648b99d573237028a8d21';

router.get('/:channelName/:uid/', (req, res) => {
    const channelName = req.params.channelName;
    const uid = req.params.uid;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpiredTs
        );
        res.json({ token: token });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

module.exports = router;