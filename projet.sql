-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Hôte : db
-- Généré le : Dim 29 mars 2020 à 17:36
-- Version du serveur :  8.0.19
-- Version de PHP : 7.4.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de données : `projet_web`
--
CREATE DATABASE IF NOT EXISTS `projet_web` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `projet_web`;

-- --------------------------------------------------------

--
-- Structure de la table `droits`
--

DROP TABLE IF EXISTS `droits`;
CREATE TABLE `droits` (
  `PseudoId` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `MemoId` int NOT NULL,
  `Droit` tinyint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `memos`
--

DROP TABLE IF EXISTS `memos`;
CREATE TABLE `memos` (
  `Id` int NOT NULL,
  `Texte` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `Creation` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Modif` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE `utilisateurs` (
  `Id` varchar(30) NOT NULL,
  `Hash` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `droits`
--
ALTER TABLE `droits`
  ADD PRIMARY KEY (`PseudoId`,`MemoId`);

--
-- Index pour la table `memos`
--
ALTER TABLE `memos`
  ADD PRIMARY KEY (`Id`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`Id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `memos`
--
ALTER TABLE `memos`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT;
COMMIT;
