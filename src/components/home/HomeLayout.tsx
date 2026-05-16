import React, { useEffect, useMemo } from 'react'
import RulesModal from '../RulesModal/RulesModal'
import Header from '../Header/Header'
import LobbySelector from '../LobbySelector/LobbySelector'
import InfoCard from '../InfoCard/InfoCard'
import BettingSection from '../BettingSection/BettingSection'
import TabSection from '../TabSection/TabSection'
import ActionBar from '../ActionBar/ActionBar'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../../store'
import { getQueryParams } from '../../utils/helper'
import { getSocket } from '../../socket/socket'
import { initSocketListeners } from '../../socket/socketListner'
import CommonPopup from '../modal/CommonPopup'
   const mainStyle: React.CSSProperties = {
  marginTop: '80px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',

};
const HomeLayout = () => {
   const dispatch = useDispatch<AppDispatch>();
  const socket = getSocket();
  console.log(socket)
  const queryParams = useMemo(() => getQueryParams(), []);
  const token = queryParams?.id;
  const gameId = queryParams?.game_id;
 useEffect(() => {
    if (!token) return;
    initSocketListeners(dispatch, token, gameId);
  }, [token, dispatch, gameId]);
  return (
    <>
      <CommonPopup />
      <RulesModal />
      <Header />
      <main style={mainStyle}>
        <LobbySelector />
        <InfoCard />
        <BettingSection />
        <TabSection />
      </main>
      <ActionBar />
    </>
  )
}

export default HomeLayout