<?php 
/**
* This file is part of the MediaAlignedText package
* 
* (c) J. Reuben Wetherbe <wetherbe@sas.upenn.edu>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

namespace MediaAlignedText\Core\Interfaces;

/**
 * The DependencyInjectionContainer Interface defines the methods necessary for the
 * dependency injection container that is used to instantiate the MediaAlignedText classes
 * 
 * @author wetherbe
 */
interface DependencyInjectionContainerInterface
{
    /**
     * Get a new CharacterGroup Object
     * 
     * @param Array $params  Params to help instantiate the object
     * @return CharacterGroup
     */
    function getCharacterGroup($params = null);
    
    /**
     * Get a new MediaAlignedText Object
     * 
     * @param Array $params  Params to help instantiate the object
     * @return MediaAlignedText
     */
    function getMediaAlignedText($params = null);
    
    /**
     * Get a new Text Object
     * 
     * @param Array $params  Params to help instantiate the object
     * @return Text
     */
    function getText($params = null);
    
}