<?php
/**
* This file is part of the MediaAlignedText package
* 
* (c) J. Reuben Wetherbe <jreubenwetherbee@gmail.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

namespace MediaAlignedText\Core;

class Text implements Interfaces\TextInterface
{
    /**
     * The ordered list of CharacterGroups that make up this Text
     * @var Array
     */
    protected $character_groups;
    
    /**
     * The dependency Injection Container
     * @var Interfaces\DependencyInjectionContainerInterface
     */
    protected $di_container;
    
    /**
     * Construct class and set the dependency injection container
     * @param Interfaces\DependencyInjectionContainerInterface $di_container  The DependencyInjectionContainer
     */
    public function __construct(Interfaces\DependencyInjectionContainerInterface $di_container)
    {
        $this->di_container = $di_container;
    }
    
    /**
     * Function to set the character groups for this Text
     * 
     * @param Array $character_groups
     */
    public function addCharacterGroup($character_groups) {
        $this->character_groups[] = $character_group;
    }
    
    /**
     * Get the Character Groups that make up this Text
     * 
     * @todo implement
     * @return Array
     */
    function getCharacterGroups()
    {
        return $this->character_groups;
    }
    
    /**
     * Function to return the full version of the text without any markup
     * 
     * @return String
     */
    public function getFullText(){
        $full_text = '';
        foreach($this->getCharacterGroups() as $char_group) {
            $full_text .= $char_group->getCharacters();
        }
        
        return $full_text;
    }
    
    /**
     * Function to set the character groups for this Text
     * 
     * @param Array $character_groups
     */
    public function setCharacterGroups($character_groups = array()) {
        $this->character_groups = $character_groups;
    }
}